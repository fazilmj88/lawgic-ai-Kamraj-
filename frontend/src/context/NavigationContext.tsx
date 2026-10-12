import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { View } from '../types';

export interface NavigationEntry {
  view: View;
  caseId?: string;
  tab?: string;
  docId?: string;
  stage?: string;
  step?: number;
  hasAnalysis?: boolean;
  meta?: Record<string, any>;
}

interface NavigationContextType {
  currentView: View;
  currentCaseId?: string;
  activeTab?: string;
  docId?: string;
  stage?: string;
  step?: number;
  canGoBack: boolean;
  historyLength: number;
  navigateTo: (
    view: View,
    params?: Partial<Omit<NavigationEntry, 'view'>>,
    options?: { replace?: boolean }
  ) => void;
  goBack: (fallback?: Partial<NavigationEntry>) => void;
  setCurrentView: (view: View) => void;
  setCaseId: (caseId: string) => void;
  setActiveTab: (tab: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function serializeStateToUrl(entry: NavigationEntry): string {
  const params = new URLSearchParams();
  if (entry.view && entry.view !== 'home') {
    params.set('view', entry.view);
  }
  if (entry.caseId) params.set('caseId', entry.caseId);
  if (entry.tab) params.set('tab', entry.tab);
  if (entry.docId) params.set('docId', entry.docId);
  if (entry.stage) params.set('stage', entry.stage);
  if (entry.step) params.set('step', String(entry.step));

  const query = params.toString();
  return query ? `${window.location.pathname}?${query}` : window.location.pathname;
}

export function parseUrlToState(): NavigationEntry {
  try {
    const params = new URLSearchParams(window.location.search);
    const view = (params.get('view') as View) || 'home';
    const caseId = params.get('caseId') || undefined;
    const tab = params.get('tab') || undefined;
    const docId = params.get('docId') || undefined;
    const stage = params.get('stage') || undefined;
    const step = params.get('step') ? parseInt(params.get('step')!, 10) : undefined;
    return { view, caseId, tab, docId, stage, step };
  } catch (e) {
    return { view: 'home' };
  }
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState = parseUrlToState();
  const [currentEntry, setCurrentEntry] = useState<NavigationEntry>(initialState);
  
  // Track navigation history stack internally
  const historyStackRef = useRef<NavigationEntry[]>([initialState]);
  const isNavigatingBackRef = useRef(false);

  // Initialize browser history state on mount
  useEffect(() => {
    try {
      window.history.replaceState(initialState, '', serializeStateToUrl(initialState));
    } catch (e) {
      // Ignore in restricted environments
    }
  }, []);

  // Sync with browser Back and Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      let targetState: NavigationEntry;
      if (event.state && typeof event.state === 'object' && event.state.view) {
        targetState = event.state as NavigationEntry;
      } else {
        targetState = parseUrlToState();
      }

      isNavigatingBackRef.current = true;
      // Adjust internal history stack
      if (historyStackRef.current.length > 1) {
        historyStackRef.current.pop();
      } else {
        historyStackRef.current = [targetState];
      }

      setCurrentEntry(targetState);
      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback(
    (
      view: View,
      params?: Partial<Omit<NavigationEntry, 'view'>>,
      options?: { replace?: boolean }
    ) => {
      setCurrentEntry(prev => {
        // Inherit previous caseId for case-related views if not explicitly provided
        const inheritedCaseId =
          params?.caseId !== undefined
            ? params.caseId
            : ['case-workspace', 'doc-intelligence', 'timeline', 'evidence-scanner'].includes(view)
            ? prev.caseId
            : undefined;

        const nextEntry: NavigationEntry = {
          view,
          caseId: inheritedCaseId,
          tab: params?.tab,
          docId: params?.docId,
          stage: params?.stage,
          step: params?.step,
          hasAnalysis: params?.hasAnalysis,
          meta: params?.meta
        };

        // If replacing or exact duplicate, replace top of stack
        if (options?.replace) {
          if (historyStackRef.current.length > 0) {
            historyStackRef.current[historyStackRef.current.length - 1] = nextEntry;
          } else {
            historyStackRef.current = [nextEntry];
          }
          try {
            window.history.replaceState(nextEntry, '', serializeStateToUrl(nextEntry));
          } catch (e) {}
        } else {
          // Push to history
          historyStackRef.current.push(nextEntry);
          try {
            window.history.pushState(nextEntry, '', serializeStateToUrl(nextEntry));
          } catch (e) {}
        }

        return nextEntry;
      });
    },
    []
  );

  const goBack = useCallback(
    (fallback?: Partial<NavigationEntry>) => {
      // Check if we have prior in-app history in our stack
      if (historyStackRef.current.length > 1) {
        // Standard in-app / browser back navigation
        window.history.back();
      } else {
        // Safe Fallback: User opened a deep URL directly or has no valid history
        setCurrentEntry(prev => {
          let fallbackEntry: NavigationEntry;

          if (fallback && fallback.view) {
            fallbackEntry = {
              view: fallback.view,
              caseId: fallback.caseId !== undefined ? fallback.caseId : prev.caseId,
              tab: fallback.tab,
              stage: fallback.stage,
              step: fallback.step,
              meta: fallback.meta
            };
          } else {
            // Context-aware safe fallback
            if (prev.view === 'doc-intelligence' || prev.view === 'evidence-scanner' || prev.view === 'timeline') {
              if (prev.caseId) {
                fallbackEntry = { view: 'case-workspace', caseId: prev.caseId, tab: prev.tab || 'overview' };
              } else {
                fallbackEntry = { view: 'dashboard' };
              }
            } else if (prev.view === 'case-workspace') {
              fallbackEntry = { view: 'dashboard' };
            } else if (prev.view !== 'dashboard' && prev.view !== 'home') {
              fallbackEntry = { view: 'dashboard' };
            } else if (prev.view === 'dashboard') {
              fallbackEntry = { view: 'home' };
            } else {
              // Already at home, do not navigate or loop
              return prev;
            }
          }

          historyStackRef.current = [fallbackEntry];
          try {
            window.history.replaceState(fallbackEntry, '', serializeStateToUrl(fallbackEntry));
          } catch (e) {}
          return fallbackEntry;
        });
      }
    },
    []
  );

  const setCurrentView = useCallback(
    (view: View) => {
      navigateTo(view);
    },
    [navigateTo]
  );

  const setCaseId = useCallback((caseId: string) => {
    setCurrentEntry(prev => {
      const updated = { ...prev, caseId };
      try {
        window.history.replaceState(updated, '', serializeStateToUrl(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setCurrentEntry(prev => {
      const updated = { ...prev, tab };
      try {
        window.history.replaceState(updated, '', serializeStateToUrl(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const canGoBack = historyStackRef.current.length > 1;

  return (
    <NavigationContext.Provider
      value={{
        currentView: currentEntry.view,
        currentCaseId: currentEntry.caseId,
        activeTab: currentEntry.tab,
        docId: currentEntry.docId,
        stage: currentEntry.stage,
        step: currentEntry.step,
        canGoBack,
        historyLength: historyStackRef.current.length,
        navigateTo,
        goBack,
        setCurrentView,
        setCaseId,
        setActiveTab
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
