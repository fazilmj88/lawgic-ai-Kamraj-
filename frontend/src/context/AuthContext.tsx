import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  supabase,
  loginWithEmail,
  registerWithEmail,
  logoutUser, 
  getUserProfile, 
  saveUserProfile, 
  subscribeToCases, 
  subscribeToAuditLogs, 
  createFIRCase,
  updateFIRCase,
  deleteFIRCase,
  logAuditEvent,
  isSupabaseConfigured,
  SupabaseUser
} from '../lib/supabase';
import { UserProfile, Role, TimelineEvent, FIRCaseData, AuditLogData, UserProfileData } from '../types';
import { DEFAULT_SAMPLE_CASES } from '../data/defaultCases';

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  user: UserProfile | null;
  isLoading: boolean;
  cases: FIRCaseData[];
  auditLogs: AuditLogData[];
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string, selectedRole?: Role) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, selectedRole?: Role) => Promise<void>;
  signOut: () => Promise<void>;
  updateRole: (newRole: Role, newStation?: string, newBadge?: string) => Promise<void>;
  saveCase: (caseData: FIRCaseData) => Promise<void>;
  updateCaseStatus: (caseId: string, status: FIRCaseData['status']) => Promise<void>;
  updateCaseTimeline: (caseId: string, events: TimelineEvent[]) => Promise<void>;
  addTimelineEvent: (caseId: string, eventData: Omit<TimelineEvent, 'id' | 'createdAt'>) => Promise<TimelineEvent>;
  updateTimelineEvent: (caseId: string, event: TimelineEvent) => Promise<void>;
  deleteTimelineEvent: (caseId: string, eventId: string) => Promise<void>;
  removeCase: (caseId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cases, setCases] = useState<FIRCaseData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);

  useEffect(() => {
    // 1. Check for existing local user session on mount
    const savedLocalUser = localStorage.getItem('lawgic_local_user');
    if (savedLocalUser && !user) {
      try {
        const parsed = JSON.parse(savedLocalUser);
        if (parsed && parsed.email) {
          setUser(parsed);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('Failed to load local user session:', e);
      }
    }

    // 2. Check active Supabase session
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setSupabaseUser(session.user);
          handleLoadProfile(session.user);
        } else if (!savedLocalUser) {
          setIsLoading(false);
        }
      }).catch(err => {
        console.warn('[Supabase Auth] Session retrieval notice:', err);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    // 3. Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sbUser = session?.user || null;
      setSupabaseUser(sbUser);
      if (sbUser) {
        await handleLoadProfile(sbUser);
      } else {
        const local = localStorage.getItem('lawgic_local_user');
        if (!local) {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoadProfile = async (sbUser: SupabaseUser) => {
    try {
      let profile = await getUserProfile(sbUser.id);
      
      if (!profile) {
        const initialRole: Role = (sbUser.user_metadata?.role as Role) || (sbUser.email === 'rolexrolex888888@gmail.com' ? 'Admin' : 'Sub-Inspector');
        const displayName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.displayName || 'Authorized Officer';
        
        const newProfile: UserProfileData = {
          userId: sbUser.id,
          email: sbUser.email || '',
          displayName,
          role: initialRole,
          station: 'District HQ - Central Command',
          badgeNumber: `TN-${Math.floor(1000 + Math.random() * 9000)}`,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=fff`,
          createdAt: new Date().toISOString()
        };
        
        await saveUserProfile(newProfile);
        profile = newProfile;
      }

      const resolvedUser: UserProfile = {
        id: profile.userId,
        name: profile.displayName,
        email: profile.email,
        role: profile.role,
        station: profile.station,
        badgeNumber: profile.badgeNumber,
        avatar: profile.photoURL || undefined,
        createdAt: profile.createdAt
      };

      setUser(resolvedUser);
      localStorage.setItem('lawgic_local_user', JSON.stringify(resolvedUser));
      await logAuditEvent('USER_SIGN_IN', `Signed in as ${profile.role} at ${profile.station}`, profile.station);
    } catch (err) {
      console.error('[Supabase Auth] Profile sync error:', err);
      const fallbackUser: UserProfile = {
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || 'Officer',
        email: sbUser.email || '',
        role: sbUser.email === 'rolexrolex888888@gmail.com' ? 'Admin' : 'Sub-Inspector',
        station: 'District HQ - Central Command',
        createdAt: new Date().toISOString()
      };
      setUser(fallbackUser);
      localStorage.setItem('lawgic_local_user', JSON.stringify(fallbackUser));
    }
  };

  // 4. Synchronize cases & audit logs with Supabase
  useEffect(() => {
    // Initial local cache population
    const localCases = localStorage.getItem('lawgic_local_cases');
    if (localCases) {
      try {
        const parsed = JSON.parse(localCases);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCases(parsed);
        } else {
          setCases(DEFAULT_SAMPLE_CASES);
          localStorage.setItem('lawgic_local_cases', JSON.stringify(DEFAULT_SAMPLE_CASES));
        }
      } catch {
        setCases(DEFAULT_SAMPLE_CASES);
      }
    } else {
      setCases(DEFAULT_SAMPLE_CASES);
      localStorage.setItem('lawgic_local_cases', JSON.stringify(DEFAULT_SAMPLE_CASES));
    }

    const localAudit = localStorage.getItem('lawgic_local_audit');
    if (localAudit) {
      try {
        setAuditLogs(JSON.parse(localAudit));
      } catch {}
    }

    if (!isSupabaseConfigured()) {
      return;
    }

    // Subscribe to live PostgreSQL cases
    const unsubCases = subscribeToCases((updatedCases) => {
      if (updatedCases && updatedCases.length > 0) {
        setCases(updatedCases);
        try {
          localStorage.setItem('lawgic_local_cases', JSON.stringify(updatedCases));
        } catch {}
      } else {
        setCases(prev => prev.length === 0 ? DEFAULT_SAMPLE_CASES : prev);
      }
    });

    // Subscribe to live PostgreSQL audit logs
    const unsubAudit = subscribeToAuditLogs((updatedLogs) => {
      setAuditLogs(updatedLogs);
      try {
        localStorage.setItem('lawgic_local_audit', JSON.stringify(updatedLogs));
      } catch {}
    });

    return () => {
      unsubCases();
      unsubAudit();
    };
  }, [supabaseUser]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      } else {
        // Local preview fallback officer
        const fallbackUser: UserProfile = {
          id: 'usr_officer_rajesh',
          name: 'Inspector Rajesh Kumar',
          email: 'officer.rajesh@lawgic.police.gov.in',
          role: 'Investigating Officer',
          station: 'District HQ - Central Command',
          badgeNumber: 'TN-4821',
          createdAt: new Date().toISOString()
        };
        setUser(fallbackUser);
        localStorage.setItem('lawgic_local_user', JSON.stringify(fallbackUser));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Supabase Auth] Google sign-in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const handleSignInWithEmail = async (email: string, pass: string, selectedRole?: Role) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const sbUser = await loginWithEmail(email, pass);
        if (sbUser) {
          let profile = await getUserProfile(sbUser.id);
          const role: Role = selectedRole || profile?.role || (email === 'rolexrolex888888@gmail.com' ? 'Admin' : 'Sub-Inspector');
          
          if (!profile) {
            const newProfile: UserProfileData = {
              userId: sbUser.id,
              email: sbUser.email || email,
              displayName: sbUser.user_metadata?.full_name || email.split('@')[0] || 'Officer',
              role,
              station: 'District HQ - Central Command',
              badgeNumber: `TN-${Math.floor(1000 + Math.random() * 9000)}`,
              photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=0F172A&color=fff`,
              createdAt: new Date().toISOString()
            };
            await saveUserProfile(newProfile);
            profile = newProfile;
          } else if (selectedRole && profile.role !== selectedRole) {
            await saveUserProfile({ ...profile, role: selectedRole });
            profile.role = selectedRole;
          }

          const resolvedUser: UserProfile = {
            id: profile.userId,
            name: profile.displayName,
            email: profile.email,
            role: profile.role,
            station: profile.station,
            badgeNumber: profile.badgeNumber,
            avatar: profile.photoURL || undefined,
            createdAt: profile.createdAt
          };
          setUser(resolvedUser);
          localStorage.setItem('lawgic_local_user', JSON.stringify(resolvedUser));
        }
      } else {
        // Fallback local session for seamless development / preview
        const role: Role = selectedRole || (email === 'rolexrolex888888@gmail.com' ? 'Admin' : 'Sub-Inspector');
        const fallbackUser: UserProfile = {
          id: `usr_${Math.random().toString(36).substring(2, 11)}`,
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Authorized Officer',
          email,
          role,
          station: 'District HQ - Central Command',
          badgeNumber: `TN-${Math.floor(1000 + Math.random() * 9000)}`,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=0F172A&color=fff`,
          createdAt: new Date().toISOString()
        };
        setUser(fallbackUser);
        localStorage.setItem('lawgic_local_user', JSON.stringify(fallbackUser));
        setIsLoading(false);
      }
    } catch (error: any) {
      console.warn('[Supabase Auth] Email sign-in notice:', error?.message || error);
      setIsLoading(false);
      throw error;
    }
  };

  const handleRegisterWithEmail = async (name: string, email: string, pass: string, selectedRole?: Role) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const roleToAssign: Role = selectedRole || (email === 'rolexrolex888888@gmail.com' ? 'Admin' : 'Constable');
        let sbUser: SupabaseUser | null = null;
        try {
          sbUser = await registerWithEmail(name, email, pass, roleToAssign);
        } catch (regErr: any) {
          if (regErr?.message?.includes('already registered') || regErr?.status === 422) {
            sbUser = await loginWithEmail(email, pass);
          } else {
            throw regErr;
          }
        }

        if (sbUser) {
          const role: Role = roleToAssign;
          const newProfile: UserProfileData = {
            userId: sbUser.id,
            email: sbUser.email || email,
            displayName: name || sbUser.user_metadata?.full_name || 'Authorized Officer',
            role,
            station: 'District HQ - Central Command',
            badgeNumber: `TN-${Math.floor(1000 + Math.random() * 9000)}`,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Officer')}&background=0F172A&color=fff`,
            createdAt: new Date().toISOString()
          };
          await saveUserProfile(newProfile);
          const resolvedUser: UserProfile = {
            id: newProfile.userId,
            name: newProfile.displayName,
            email: newProfile.email,
            role: newProfile.role,
            station: newProfile.station,
            badgeNumber: newProfile.badgeNumber,
            avatar: newProfile.photoURL,
            createdAt: newProfile.createdAt
          };
          setUser(resolvedUser);
          localStorage.setItem('lawgic_local_user', JSON.stringify(resolvedUser));
        }
      } else {
        const role: Role = selectedRole || (email === 'rolexrolex888888@gmail.com' ? 'Admin' : 'Sub-Inspector');
        const fallbackUser: UserProfile = {
          id: `usr_${Math.random().toString(36).substring(2, 11)}`,
          name: name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Authorized Officer',
          email,
          role,
          station: 'District HQ - Central Command',
          badgeNumber: `TN-${Math.floor(1000 + Math.random() * 9000)}`,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Officer')}&background=0F172A&color=fff`,
          createdAt: new Date().toISOString()
        };
        setUser(fallbackUser);
        localStorage.setItem('lawgic_local_user', JSON.stringify(fallbackUser));
        setIsLoading(false);
      }
    } catch (error: any) {
      console.warn('[Supabase Auth] Email register notice:', error?.message || error);
      setIsLoading(false);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      if (user) {
        await logAuditEvent('USER_SIGN_OUT', `Signed out from ${user.station}`, user.station);
      }
      localStorage.removeItem('lawgic_local_user');
      if (isSupabaseConfigured()) {
        await logoutUser();
      }
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('[Supabase Auth] Sign-out error:', error);
      localStorage.removeItem('lawgic_local_user');
      setUser(null);
      setSupabaseUser(null);
    }
  };

  const updateRole = async (newRole: Role, newStation?: string, newBadge?: string) => {
    if (!user) return;
    
    const updatedData: UserProfileData = {
      userId: user.id,
      email: user.email,
      displayName: user.name,
      role: newRole,
      station: newStation || user.station,
      badgeNumber: newBadge || user.badgeNumber,
      photoURL: user.avatar,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (supabaseUser) {
      await saveUserProfile(updatedData);
    }
    const updatedUser = { ...user, role: newRole, station: updatedData.station, badgeNumber: updatedData.badgeNumber };
    setUser(updatedUser);
    localStorage.setItem('lawgic_local_user', JSON.stringify(updatedUser));
    await logAuditEvent('ROLE_UPDATED', `Designation updated to ${newRole} at ${updatedData.station}`, updatedData.station);
  };

  const saveCase = async (caseData: FIRCaseData) => {
    setCases(prev => {
      const filtered = prev.filter(c => c.caseId !== caseData.caseId);
      const nextList = [caseData, ...filtered];
      try {
        localStorage.setItem('lawgic_local_cases', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await createFIRCase(caseData);
    } catch (e) {
      console.warn('[Supabase Database] Case save notice:', e);
    }
    await logAuditEvent('FIR_SAVED', `FIR ${caseData.caseId} recorded for ${caseData.complainant} [${caseData.status}]`, caseData.policeStation);
  };

  const updateCaseStatus = async (caseId: string, status: FIRCaseData['status']) => {
    setCases(prev => {
      const nextList = prev.map(c => c.caseId === caseId ? { ...c, status, updatedAt: new Date().toISOString() } : c);
      try {
        localStorage.setItem('lawgic_local_cases', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await updateFIRCase(caseId, { status });
    } catch (e) {
      console.warn('[Supabase Database] Status update notice:', e);
    }
    await logAuditEvent('STATUS_UPDATED', `Case ${caseId} transition to status: ${status}`, user?.station);
  };

  const updateCaseTimeline = async (caseId: string, events: TimelineEvent[]) => {
    setCases(prev => {
      const nextList = prev.map(c => c.caseId === caseId ? { ...c, timelineEvents: events, updatedAt: new Date().toISOString() } : c);
      try {
        localStorage.setItem('lawgic_local_cases', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await updateFIRCase(caseId, { timelineEvents: events });
    } catch (e) {
      console.warn('[Supabase Database] Timeline update notice:', e);
    }
    await logAuditEvent('TIMELINE_UPDATED', `Case ${caseId} updated with ${events.length} timeline events`, user?.station);
  };

  const addTimelineEvent = async (caseId: string, eventData: Omit<TimelineEvent, 'id' | 'createdAt'>): Promise<TimelineEvent> => {
    const newEvent: TimelineEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedEventsList: TimelineEvent[] = [];

    setCases(prev => {
      const nextList = prev.map(c => {
        if (c.caseId === caseId) {
          const currentEvents = c.timelineEvents || [];
          updatedEventsList = [...currentEvents, newEvent];
          return { ...c, timelineEvents: updatedEventsList, updatedAt: new Date().toISOString() };
        }
        return c;
      });
      try {
        localStorage.setItem('lawgic_local_cases', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await updateFIRCase(caseId, { timelineEvents: updatedEventsList });
    } catch (e) {
      console.warn('[Supabase Database] Add event notice:', e);
    }
    await logAuditEvent('TIMELINE_EVENT_ADDED', `Event "${newEvent.title}" added to case ${caseId} at location: ${newEvent.location}`, user?.station);

    return newEvent;
  };

  const updateTimelineEvent = async (caseId: string, updatedEvent: TimelineEvent) => {
    let updatedEventsList: TimelineEvent[] = [];

    setCases(prev => {
      const nextList = prev.map(c => {
        if (c.caseId === caseId) {
          const currentEvents = c.timelineEvents || [];
          updatedEventsList = currentEvents.map(e => e.id === updatedEvent.id ? { ...updatedEvent, updatedAt: new Date().toISOString() } : e);
          return { ...c, timelineEvents: updatedEventsList, updatedAt: new Date().toISOString() };
        }
        return c;
      });
      try {
        localStorage.setItem('lawgic_local_cases', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await updateFIRCase(caseId, { timelineEvents: updatedEventsList });
    } catch (e) {
      console.warn('[Supabase Database] Update event notice:', e);
    }
    await logAuditEvent('TIMELINE_EVENT_EDITED', `Event "${updatedEvent.title}" updated for case ${caseId}`, user?.station);
  };

  const deleteTimelineEvent = async (caseId: string, eventId: string) => {
    let updatedEventsList: TimelineEvent[] = [];

    setCases(prev => {
      const nextList = prev.map(c => {
        if (c.caseId === caseId) {
          const currentEvents = c.timelineEvents || [];
          updatedEventsList = currentEvents.filter(e => e.id !== eventId);
          return { ...c, timelineEvents: updatedEventsList, updatedAt: new Date().toISOString() };
        }
        return c;
      });
      try {
        localStorage.setItem('lawgic_local_cases', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await updateFIRCase(caseId, { timelineEvents: updatedEventsList });
    } catch (e) {
      console.warn('[Supabase Database] Delete event notice:', e);
    }
    await logAuditEvent('TIMELINE_EVENT_DELETED', `Event ${eventId} removed from case ${caseId}`, user?.station);
  };

  const removeCase = async (caseId: string) => {
    setCases(prev => {
      const nextList = prev.filter(c => c.caseId !== caseId);
      try {
        localStorage.setItem('lawgic_local_cases', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      await deleteFIRCase(caseId);
    } catch (e) {
      console.warn('[Supabase Database] Delete case notice:', e);
    }
    await logAuditEvent('CASE_DELETED', `Case reference ${caseId} deleted`, user?.station);
  };

  return (
    <AuthContext.Provider value={{
      supabaseUser,
      user,
      isLoading,
      cases,
      auditLogs,
      signInWithGoogle: handleSignIn,
      signInWithEmail: handleSignInWithEmail,
      registerWithEmail: handleRegisterWithEmail,
      signOut: handleSignOut,
      updateRole,
      saveCase,
      updateCaseStatus,
      updateCaseTimeline,
      addTimelineEvent,
      updateTimelineEvent,
      deleteTimelineEvent,
      removeCase
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
