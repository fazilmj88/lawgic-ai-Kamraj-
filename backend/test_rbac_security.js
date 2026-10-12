// test_rbac_security.js
// Complete End-to-End RBAC Security Test for LAWgic AI

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const rawSupabaseUrl = process.env.TEST_SUPABASE_URL || 'http://localhost:3000';
const SUPABASE_URL = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const BACKEND_URL = 'http://localhost:3000';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_USERS = [
  {
    roleKey: 'POLICE_IO',
    roleLabel: 'Police Officer / Investigating Officer (IO)',
    email: 'test_io_security@lawgic.ai',
    password: 'SecurePassword123!',
    fullName: 'Insp. Vikram Rathore (IO-1)',
    profileRole: 'Investigating Officer',
    badge: 'TN-1001',
    station: 'Central Crime Branch'
  },
  {
    roleKey: 'FORENSIC',
    roleLabel: 'Forensic Officer',
    email: 'test_forensic_security@lawgic.ai',
    password: 'SecurePassword123!',
    fullName: 'Dr. Ananya Sharma (FSL)',
    profileRole: 'Forensic Officer',
    badge: 'FSL-2002',
    station: 'State Forensic Science Lab'
  },
  {
    roleKey: 'LEGAL',
    roleLabel: 'Legal / Prosecution Officer',
    email: 'test_prosecution_security@lawgic.ai',
    password: 'SecurePassword123!',
    fullName: 'Adv. K. Swaminathan (PP)',
    profileRole: 'Legal Officer',
    badge: 'BAR-3003',
    station: 'Directorate of Prosecution'
  },
  {
    roleKey: 'JUDICIAL',
    roleLabel: 'Judicial / Court User',
    email: 'test_court_security@lawgic.ai',
    password: 'SecurePassword123!',
    fullName: 'Hon. Magistrate S. Iyer',
    profileRole: 'Authorized Viewer',
    badge: 'JUD-4004',
    station: 'Chief Metropolitan Magistrate Court'
  },
  {
    roleKey: 'ADMIN',
    roleLabel: 'System Administrator',
    email: 'test_admin_security@lawgic.ai',
    password: 'SecurePassword123!',
    fullName: 'Admin Murugan K',
    profileRole: 'Admin',
    badge: 'SYS-5005',
    station: 'Police IT & Cyber Command'
  },
  {
    roleKey: 'POLICE_IO_2',
    roleLabel: 'Investigating Officer 2 (Case B Owner)',
    email: 'test_io2_security@lawgic.ai',
    password: 'SecurePassword123!',
    fullName: 'Insp. Ramesh Kumar (IO-2)',
    profileRole: 'Investigating Officer',
    badge: 'TN-1002',
    station: 'North Zone Crime Branch'
  }
];

// Result collector
const results = [];

function recordResult(role, category, action, expected, actual, result, details = '') {
  results.push({
    role,
    category,
    action,
    expected,
    actual,
    result, // PASS, FAIL, WARNING
    details
  });
}

async function runSecurityTest() {
  console.log('===============================================================');
  console.log('STARTING COMPLETE END-TO-END RBAC SECURITY TEST');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Backend URL:', BACKEND_URL);
  console.log('===============================================================\n');

  // STEP 1: Provision Real Users
  console.log('--- STEP 1: PROVISIONING REAL SUPABASE TEST USERS ---');
  const userClients = {};

  for (const u of TEST_USERS) {
    try {
      // Check if user already exists
      const { data: listData } = await admin.auth.admin.listUsers();
      const existing = listData?.users?.find(usr => usr.email === u.email);

      let uid = existing?.id;
      if (!existing) {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: {
            full_name: u.fullName,
            role: u.profileRole
          }
        });
        if (cErr) {
          console.error(`Failed to create ${u.email}:`, cErr.message);
          continue;
        }
        uid = created.user.id;
        console.log(`Created user ${u.email} [${u.profileRole}] id: ${uid}`);
      } else {
        // Ensure confirmed and correct password
        await admin.auth.admin.updateUserById(uid, {
          password: u.password,
          email_confirm: true,
          user_metadata: {
            full_name: u.fullName,
            role: u.profileRole
          }
        });
        console.log(`Updated existing user ${u.email} [${u.profileRole}] id: ${uid}`);
      }

      // Ensure profile row matches role
      await admin.from('profiles').upsert({
        id: uid,
        email: u.email,
        full_name: u.fullName,
        role: u.profileRole,
        badge_number: u.badge,
        department: u.station,
        updated_at: new Date().toISOString()
      });

      // Authenticate via client to get real JWT session
      const { data: authData, error: aErr } = await anonClient.auth.signInWithPassword({
        email: u.email,
        password: u.password
      });

      if (aErr || !authData?.session) {
        console.error(`Failed to sign in ${u.email}:`, aErr?.message);
        continue;
      }

      const jwt = authData.session.access_token;
      // Scoped client with this user's JWT
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } }
      });

      userClients[u.roleKey] = {
        ...u,
        id: uid,
        jwt,
        client
      };
      console.log(`Authenticated ${u.roleKey} successfully. JWT length: ${jwt.length}`);
    } catch (err) {
      console.error(`Error provisioning ${u.email}:`, err);
    }
  }

  // Verify all 5 primary roles + IO2 are authenticated
  const io1 = userClients['POLICE_IO'];
  const forensic = userClients['FORENSIC'];
  const legal = userClients['LEGAL'];
  const judicial = userClients['JUDICIAL'];
  const sysAdmin = userClients['ADMIN'];
  const io2 = userClients['POLICE_IO_2'];

  if (!io1 || !forensic || !legal || !judicial || !sysAdmin || !io2) {
    console.error('CRITICAL: Missing one or more authenticated test users!');
    process.exit(1);
  }

  console.log('\n--- STEP 2: SETUP TEST CASES AND DOCUMENTS IN DATABASE ---');
  // Case A: Assigned to IO-1. Has forensic report, witness statement, FIR, court document.
  const caseA_id = 'c0000000-0000-4000-a000-000000000001';
  const caseA_strId = 'SEC-CASE-A-2026';
  
  // Case B: Assigned to IO-2.
  const caseB_id = 'c0000000-0000-4000-a000-000000000002';
  const caseB_strId = 'SEC-CASE-B-2026';
  const testCaseId = 'c0000000-0000-4000-a000-000000000099';

  // Clean any previous test artifacts
  await admin.from('cases').delete().eq('id', testCaseId);

  // Seed Case A
  await admin.from('cases').upsert({
    id: caseA_id,
    case_id: caseA_strId,
    fir_number: 'FIR-SEC-001/2026',
    title: 'Armed Robbery and Snatching at Central Market',
    crime_type: 'Robbery / Section 309 BNS',
    district: 'Central District',
    police_station: 'Central Crime Branch',
    assigned_officer: io1.id,
    status: 'Investigation Active',
    complainant: 'Ramesh Patel',
    incident_description: 'Two armed perpetrators snatched bag containing gold and cash at gunpoint.',
    incident_date: '2026-09-01T10:00:00Z',
    created_at: new Date().toISOString()
  });

  // Seed Case B
  await admin.from('cases').upsert({
    id: caseB_id,
    case_id: caseB_strId,
    fir_number: 'FIR-SEC-002/2026',
    title: 'Homicide Investigation at North Warehouse',
    crime_type: 'Murder / Section 103 BNS',
    district: 'North District',
    police_station: 'North Zone Crime Branch',
    assigned_officer: io2.id,
    status: 'Under Investigation',
    complainant: 'Sub-Inspector Kumar',
    incident_description: 'Homicide at warehouse with ballistic shell casings recovered.',
    incident_date: '2026-09-05T22:00:00Z',
    created_at: new Date().toISOString()
  });

  // Seed Documents for Case A
  const docFIR_id = 'd0000000-0000-4000-b000-000000000001';
  const docWitness_id = 'd0000000-0000-4000-b000-000000000002';
  const docForensic_id = 'd0000000-0000-4000-b000-000000000003';
  const docLegal_id = 'd0000000-0000-4000-b000-000000000004';
  const docCourt_id = 'd0000000-0000-4000-b000-000000000005';

  // Seed Documents for Case B
  const docCaseB_id = 'd0000000-0000-4000-b000-000000000006';

  await admin.from('case_documents').upsert([
    {
      id: docFIR_id,
      case_id: caseA_id,
      document_name: 'Original_FIR_001.pdf',
      document_type: 'FIR Draft',
      current_version: 1,
      sha256_hash: crypto.createHash('sha256').update('FIR 001 Original Facts').digest('hex'),
      uploaded_by: io1.id,
      metadata: { classification: 'Police FIR', status: 'Draft' }
    },
    {
      id: docWitness_id,
      case_id: caseA_id,
      document_name: 'Witness_Statement_Eyewitness1.pdf',
      document_type: 'Witness Statement',
      current_version: 1,
      sha256_hash: crypto.createHash('sha256').update('Witness Statement 1').digest('hex'),
      uploaded_by: io1.id,
      metadata: { classification: 'Witness Statement 161 CrPC' }
    },
    {
      id: docForensic_id,
      case_id: caseA_id,
      document_name: 'FSL_Ballistics_Report_001.pdf',
      document_type: 'Forensic Reports',
      current_version: 1,
      sha256_hash: crypto.createHash('sha256').update('FSL Ballistics').digest('hex'),
      uploaded_by: forensic.id,
      metadata: { classification: 'Forensic Report', fsl_lab: 'State FSL' }
    },
    {
      id: docLegal_id,
      case_id: caseA_id,
      document_name: 'Prosecution_Charge_Opinion.pdf',
      document_type: 'Legal Opinion',
      current_version: 1,
      sha256_hash: crypto.createHash('sha256').update('Prosecution Opinion').digest('hex'),
      uploaded_by: legal.id,
      metadata: { classification: 'Legal Scrutiny Memo' }
    },
    {
      id: docCourt_id,
      case_id: caseA_id,
      document_name: 'Final_Chargesheet_Court_Submitted.pdf',
      document_type: 'Court Record',
      current_version: 1,
      sha256_hash: crypto.createHash('sha256').update('Final Chargesheet Court').digest('hex'),
      uploaded_by: io1.id,
      metadata: { classification: 'Judicial Submission', finalizedForCourt: true, court_cognizance: true }
    },
    {
      id: docCaseB_id,
      case_id: caseB_id,
      document_name: 'Case_B_Homicide_FIR.pdf',
      document_type: 'FIR Draft',
      current_version: 1,
      sha256_hash: crypto.createHash('sha256').update('Case B Sensitive Murder FIR').digest('hex'),
      uploaded_by: io2.id,
      metadata: { classification: 'Sensitive Homicide FIR' }
    }
  ]);

  // Seed Storage File in bucket 'case-documents'
  try {
    await admin.storage.from('case-documents').upload('case-A/Original_FIR_001.pdf', Buffer.from('PDF CONTENT FIR 001'), {
      contentType: 'application/pdf',
      upsert: true
    });
    await admin.storage.from('case-documents').upload('case-B/Case_B_Homicide_FIR.pdf', Buffer.from('PDF CONTENT SENSITIVE CASE B'), {
      contentType: 'application/pdf',
      upsert: true
    });
    console.log('Seeded storage objects in bucket case-documents.');
  } catch (stErr) {
    console.warn('Storage seed warning:', stErr.message);
  }

  console.log('Database and storage test fixtures established.\n');

  // Helper for API calls with Bearer token
  async function callApi(endpoint, method = 'POST', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      const contentType = resp.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await resp.json();
      } else if (contentType.includes('application/pdf')) {
        data = { isPdf: true, bytes: await resp.arrayBuffer() };
      } else {
        data = await resp.text();
      }
      return { status: resp.status, data, ok: resp.ok };
    } catch (e) {
      return { status: 500, error: e.message, ok: false };
    }
  }

  // =========================================================================
  // TEST SECTION 1: POLICE OFFICER / INVESTIGATING OFFICER (IO)
  // =========================================================================
  console.log('=============================================================');
  console.log('TESTING ROLE 1: POLICE OFFICER / INVESTIGATING OFFICER (IO)');
  console.log('=============================================================');

  // CASE Actions
  {
    // 1. View Case A
    const { data: viewA, error: errViewA } = await io1.client.from('cases').select('*').eq('id', caseA_id);
    const canViewA = !errViewA && viewA?.length > 0;
    recordResult(
      'POLICE_IO', 'CASE', 'View authorized case (Case A)',
      'ALLOW (200 / row returned)',
      canViewA ? 'ALLOWED (Case retrieved)' : `DENIED (${errViewA?.message})`,
      canViewA ? 'PASS' : 'FAIL',
      `Query status: ${errViewA?.message || 'OK'}`
    );

    // 2. Create Case
    const testCaseId = 'c0000000-0000-4000-a000-000000000099';
    const { data: insCase, error: insCaseErr } = await io1.client.from('cases').insert({
      id: testCaseId,
      case_id: 'SEC-IO-CREATE-001',
      fir_number: 'FIR-TEST-IO-99',
      title: 'IO Created Case',
      police_station: io1.station,
      assigned_officer: io1.id
    }).select();
    const canCreateCase = !insCaseErr && insCase?.length > 0;
    recordResult(
      'POLICE_IO', 'CASE', 'Create new case',
      'ALLOW (Case created in DB)',
      canCreateCase ? 'ALLOWED (Case created)' : `DENIED (${insCaseErr?.message})`,
      canCreateCase ? 'PASS' : 'FAIL'
    );

    // 3. Edit Case Information
    const { error: updCaseErr } = await io1.client.from('cases').update({
      incident_description: 'Updated facts by Investigating Officer'
    }).eq('id', caseA_id);
    recordResult(
      'POLICE_IO', 'CASE', 'Edit investigation case information',
      'ALLOW (Update applied)',
      !updCaseErr ? 'ALLOWED (Updated)' : `DENIED (${updCaseErr?.message})`,
      !updCaseErr ? 'PASS' : 'FAIL'
    );

    // 4. Delete Case
    const { error: delCaseErr } = await io1.client.from('cases').delete().eq('id', testCaseId);
    recordResult(
      'POLICE_IO', 'CASE', 'Delete case',
      'DENY (Only Admin / Court order)',
      !delCaseErr ? 'ALLOWED (Case deleted by IO)' : `DENIED (${delCaseErr?.message})`,
      !delCaseErr ? 'FAIL' : 'PASS',
      'Police officers should not delete official case records without supervisor/admin clearance.'
    );
  }

  // FIR Actions
  {
    // View FIR
    const { data: firDoc, error: fErr } = await io1.client.from('case_documents').select('*').eq('id', docFIR_id);
    recordResult(
      'POLICE_IO', 'FIR', 'View FIR',
      'ALLOW',
      firDoc?.length > 0 ? 'ALLOWED' : `DENIED (${fErr?.message})`,
      firDoc?.length > 0 ? 'PASS' : 'FAIL'
    );

    // Create / Upload FIR
    const newFirDocId = 'd0000000-0000-4000-b000-000000000091';
    const { error: insFirErr } = await io1.client.from('case_documents').insert({
      id: newFirDocId,
      case_id: caseA_id,
      document_name: 'IO_Uploaded_FIR.pdf',
      document_type: 'FIR Draft',
      uploaded_by: io1.id
    });
    recordResult(
      'POLICE_IO', 'FIR', 'Create / Upload FIR',
      'ALLOW',
      !insFirErr ? 'ALLOWED' : `DENIED (${insFirErr?.message})`,
      !insFirErr ? 'PASS' : 'FAIL'
    );

    // Edit FIR
    const { error: updFirErr } = await io1.client.from('case_documents').update({
      document_name: 'IO_Revised_FIR_v2.pdf'
    }).eq('id', docFIR_id);
    recordResult(
      'POLICE_IO', 'FIR', 'Edit FIR draft',
      'ALLOW',
      !updFirErr ? 'ALLOWED' : `DENIED (${updFirErr?.message})`,
      !updFirErr ? 'PASS' : 'FAIL'
    );

    // Generate FIR PDF via Backend API
    const genFirRes = await callApi('/api/fir/generate', 'POST', {
      firNumber: 'FIR-SEC-001/2026',
      policeStation: 'Central Crime Branch',
      district: 'Central District',
      complainantName: 'Ramesh Patel',
      incidentDate: '2026-09-01',
      incidentTime: '10:00 AM',
      factsNarrative: 'Two armed perpetrators snatched bag containing gold.',
      sections: [{ section: 'Section 309 BNS 2023 - Robbery' }]
    }, io1.jwt);
    recordResult(
      'POLICE_IO', 'FIR', 'Generate FIR PDF (/api/fir/generate)',
      'ALLOW (PDF generated 200)',
      genFirRes.status === 200 ? 'ALLOWED (200 PDF returned)' : `DENIED (${genFirRes.status})`,
      genFirRes.status === 200 ? 'PASS' : 'FAIL'
    );

    // Delete FIR
    const { error: delFirErr } = await io1.client.from('case_documents').delete().eq('id', newFirDocId);
    recordResult(
      'POLICE_IO', 'FIR', 'Delete FIR document',
      'DENY (FIR records must be immutable/permanent)',
      !delFirErr ? 'ALLOWED (FIR deleted by IO)' : `DENIED (${delFirErr?.message})`,
      !delFirErr ? 'FAIL' : 'PASS',
      'Original FIR records in CCTNS/police database must be non-deletable.'
    );
  }

  // DOCUMENTS & EVIDENCE
  {
    // Upload Witness Statement
    const witnessDocId = 'd0000000-0000-4000-b000-000000000092';
    const { error: wErr } = await io1.client.from('case_documents').insert({
      id: witnessDocId,
      case_id: caseA_id,
      document_name: 'Victim_164_Statement.pdf',
      document_type: 'Witness Statement',
      uploaded_by: io1.id
    });
    recordResult(
      'POLICE_IO', 'DOCUMENTS', 'Upload victim / witness statement',
      'ALLOW',
      !wErr ? 'ALLOWED' : `DENIED (${wErr?.message})`,
      !wErr ? 'PASS' : 'FAIL'
    );

    // Storage Upload
    const stUp = await io1.client.storage.from('case-documents').upload(`case-A/io-test-${Date.now()}.txt`, Buffer.from('Evidence text'), { contentType: 'text/plain' });
    recordResult(
      'POLICE_IO', 'STORAGE', 'Upload to Supabase Storage case-documents',
      'ALLOW',
      !stUp.error ? 'ALLOWED' : `DENIED (${stUp.error?.message})`,
      !stUp.error ? 'PASS' : 'FAIL'
    );

    // Storage Download
    const stDown = await io1.client.storage.from('case-documents').download('case-A/Original_FIR_001.pdf');
    recordResult(
      'POLICE_IO', 'STORAGE', 'Download authorized case document',
      'ALLOW',
      !stDown.error ? 'ALLOWED' : `DENIED (${stDown.error?.message})`,
      !stDown.error ? 'PASS' : 'FAIL'
    );

    // Version creation
    const { error: vErr } = await io1.client.from('document_versions').insert({
      document_id: docFIR_id,
      version_number: 2,
      file_path: 'case-A/FIR_v2.pdf',
      sha256_hash: crypto.createHash('sha256').update('v2').digest('hex'),
      created_by: io1.id
    });
    recordResult(
      'POLICE_IO', 'DOCUMENTS', 'Create document version',
      'ALLOW',
      !vErr ? 'ALLOWED' : `DENIED (${vErr?.message})`,
      !vErr ? 'PASS' : 'FAIL'
    );
  }

  // AI FEATURES
  {
    const aiComp = await callApi('/api/ai/analyze-complaint', 'POST', {
      complainantName: 'Ramesh Patel',
      description: 'Perpetrators snatched gold chain with weapon'
    }, io1.jwt);
    recordResult(
      'POLICE_IO', 'AI', 'Use AI Complaint Analysis (/api/ai/analyze-complaint)',
      'ALLOW (200)',
      aiComp.status === 200 ? 'ALLOWED (200)' : `STATUS ${aiComp.status}`,
      aiComp.status === 200 ? 'PASS' : 'FAIL'
    );

    const aiSearch = await callApi('/api/ai/search-case', 'POST', {
      query: 'weapon',
      caseId: caseA_strId,
      userRole: io1.profileRole
    }, io1.jwt);
    recordResult(
      'POLICE_IO', 'AI', 'Use AI Document Search / RAG',
      'ALLOW (200)',
      aiSearch.status === 200 ? 'ALLOWED (200)' : `STATUS ${aiSearch.status}`,
      aiSearch.status === 200 ? 'PASS' : 'FAIL'
    );
  }

  // CHAIN OF CUSTODY
  {
    const { error: cocErr } = await io1.client.from('chain_of_custody').insert({
      case_id: caseA_id,
      action: 'SEIZED_FROM_CRIME_SCENE',
      to_officer: io1.id,
      location: 'Central Market Crime Scene',
      notes: 'Recovered empty cartridge casing 9mm'
    });
    recordResult(
      'POLICE_IO', 'CHAIN_OF_CUSTODY', 'Add chain of custody event',
      'ALLOW',
      !cocErr ? 'ALLOWED' : `DENIED (${cocErr?.message})`,
      !cocErr ? 'PASS' : 'FAIL'
    );

    // Modify existing custody event (Should be FORBIDDEN - immutable history!)
    const { data: cocData } = await io1.client.from('chain_of_custody').select('id').eq('case_id', caseA_id).limit(1);
    if (cocData?.[0]) {
      const { error: modCocErr } = await io1.client.from('chain_of_custody').update({
        notes: 'Tampered custody notes'
      }).eq('id', cocData[0].id);
      recordResult(
        'POLICE_IO', 'CHAIN_OF_CUSTODY', 'Modify existing chain of custody event',
        'DENY (Chain of custody is tamper-evident immutable)',
        !modCocErr ? 'ALLOWED (Modified existing event)' : `DENIED (${modCocErr?.message})`,
        !modCocErr ? 'FAIL' : 'PASS',
        'Chain of custody events must be strictly append-only.'
      );
    }
  }

  // FORBIDDEN ACTIONS FOR IO:
  {
    // Modify Audit Logs
    const { data: aLog } = await admin.from('audit_logs').select('id').limit(1);
    if (aLog?.[0]) {
      const { error: updAuditErr } = await io1.client.from('audit_logs').update({
        action: 'TAMPERED_ACTION'
      }).eq('id', aLog[0].id);
      recordResult(
        'POLICE_IO', 'AUDIT', 'Modify audit logs',
        'DENY',
        !updAuditErr ? 'ALLOWED (Audit modified by IO)' : `DENIED (${updAuditErr?.message})`,
        !updAuditErr ? 'FAIL' : 'PASS'
      );

      const { error: delAuditErr } = await io1.client.from('audit_logs').delete().eq('id', aLog[0].id);
      recordResult(
        'POLICE_IO', 'AUDIT', 'Delete audit logs',
        'DENY',
        !delAuditErr ? 'ALLOWED (Audit deleted by IO)' : `DENIED (${delAuditErr?.message})`,
        !delAuditErr ? 'FAIL' : 'PASS'
      );
    }

    // Change User Roles
    const { error: roleErr } = await io1.client.from('profiles').update({
      role: 'Admin'
    }).eq('id', io1.id);
    recordResult(
      'POLICE_IO', 'USER_MANAGEMENT', 'Self-elevate role to Admin',
      'DENY',
      !roleErr ? 'ALLOWED (IO escalated own role to Admin)' : `DENIED (${roleErr?.message})`,
      !roleErr ? 'FAIL' : 'PASS'
    );
  }

  // =========================================================================
  // TEST SECTION 2: FORENSIC OFFICER
  // =========================================================================
  console.log('\n=============================================================');
  console.log('TESTING ROLE 2: FORENSIC OFFICER');
  console.log('=============================================================');

  // CRITICAL TEST: Attempt FIR Edit as Forensic Officer
  {
    const { error: editFirAsForensic } = await forensic.client.from('case_documents').update({
      document_name: 'Forensic_Hacked_FIR.pdf',
      extracted_text: 'Altered facts of the police FIR by forensic officer'
    }).eq('id', docFIR_id);

    recordResult(
      'FORENSIC', 'FIR', 'Attempt FIR edit / modification (CRITICAL TEST)',
      'DENY (403 / RLS Permission Denied)',
      !editFirAsForensic ? 'ALLOWED (Forensic officer edited FIR!)' : `DENIED (${editFirAsForensic?.message})`,
      !editFirAsForensic ? 'FAIL' : 'PASS',
      'Forensic officers must NOT be able to modify police FIR records.'
    );
  }

  // CRITICAL TEST: Attempt to Create FIR as Forensic Officer
  {
    const fFirId = 'd0000000-0000-4000-b000-000000000088';
    const { error: createFirAsForensic } = await forensic.client.from('case_documents').insert({
      id: fFirId,
      case_id: caseA_id,
      document_name: 'Illegal_Forensic_FIR.pdf',
      document_type: 'FIR Draft',
      uploaded_by: forensic.id
    });
    recordResult(
      'FORENSIC', 'FIR', 'Create / Register FIR',
      'DENY (Only Police / IO can create FIR)',
      !createFirAsForensic ? 'ALLOWED (Forensic officer created FIR)' : `DENIED (${createFirAsForensic?.message})`,
      !createFirAsForensic ? 'FAIL' : 'PASS'
    );
  }

  // CRITICAL TEST: Attempt to Modify Witness Statement as Forensic Officer
  {
    const { error: modWitnessAsForensic } = await forensic.client.from('case_documents').update({
      extracted_text: 'Tampered witness narrative'
    }).eq('id', docWitness_id);
    recordResult(
      'FORENSIC', 'DOCUMENTS', 'Modify witness / victim statement',
      'DENY',
      !modWitnessAsForensic ? 'ALLOWED (Forensic officer modified witness statement)' : `DENIED (${modWitnessAsForensic?.message})`,
      !modWitnessAsForensic ? 'FAIL' : 'PASS'
    );
  }

  // ALLOWED FORENSIC ACTIONS:
  {
    // Upload Forensic Report
    const fReportId = 'd0000000-0000-4000-b000-000000000077';
    const { error: upFslErr } = await forensic.client.from('case_documents').insert({
      id: fReportId,
      case_id: caseA_id,
      document_name: 'Toxicology_Report_001.pdf',
      document_type: 'Forensic Reports',
      uploaded_by: forensic.id,
      metadata: { author: forensic.fullName, fsl_lab: forensic.station }
    });
    recordResult(
      'FORENSIC', 'FORENSIC_REPORT', 'Upload forensic report',
      'ALLOW',
      !upFslErr ? 'ALLOWED' : `DENIED (${upFslErr?.message})`,
      !upFslErr ? 'PASS' : 'FAIL'
    );

    // Update their own Forensic Report
    const { error: updFslErr } = await forensic.client.from('case_documents').update({
      ai_analysis: { observations: 'Lead residue detected on trigger mechanism' }
    }).eq('id', docForensic_id);
    recordResult(
      'FORENSIC', 'FORENSIC_REPORT', 'Update own forensic report / add observations',
      'ALLOW',
      !updFslErr ? 'ALLOWED' : `DENIED (${updFslErr?.message})`,
      !updFslErr ? 'PASS' : 'FAIL'
    );

    // Create new version of Forensic Report
    const { error: fVerErr } = await forensic.client.from('document_versions').insert({
      document_id: docForensic_id,
      version_number: 2,
      file_path: 'case-A/FSL_v2.pdf',
      sha256_hash: crypto.createHash('sha256').update('fsl-v2').digest('hex'),
      created_by: forensic.id
    });
    recordResult(
      'FORENSIC', 'FORENSIC_REPORT', 'Create new version of forensic report',
      'ALLOW',
      !fVerErr ? 'ALLOWED' : `DENIED (${fVerErr?.message})`,
      !fVerErr ? 'PASS' : 'FAIL'
    );

    // Delete Investigation Evidence (Should be DENIED)
    const { error: delEvAsForensic } = await forensic.client.from('case_documents').delete().eq('id', docWitness_id);
    recordResult(
      'FORENSIC', 'EVIDENCE', 'Delete investigation evidence / documents',
      'DENY',
      !delEvAsForensic ? 'ALLOWED (Forensic officer deleted investigation document!)' : `DENIED (${delEvAsForensic?.message})`,
      !delEvAsForensic ? 'FAIL' : 'PASS'
    );
  }

  // =========================================================================
  // TEST SECTION 3: LEGAL / PROSECUTION OFFICER
  // =========================================================================
  console.log('\n=============================================================');
  console.log('TESTING ROLE 3: LEGAL / PROSECUTION OFFICER');
  console.log('=============================================================');

  {
    // View FIR and Investigation documents
    const { data: viewLegalDocs, error: vlErr } = await legal.client.from('case_documents').select('*').eq('case_id', caseA_id);
    recordResult(
      'LEGAL', 'DOCUMENTS', 'View authorized case documents (FIR, evidence, forensic)',
      'ALLOW',
      viewLegalDocs?.length > 0 ? `ALLOWED (${viewLegalDocs.length} docs)` : `DENIED (${vlErr?.message})`,
      viewLegalDocs?.length > 0 ? 'PASS' : 'FAIL'
    );

    // Add Prosecution Observation / Scrutiny Note
    const legalDocId = 'd0000000-0000-4000-b000-000000000066';
    const { error: legInsErr } = await legal.client.from('case_documents').insert({
      id: legalDocId,
      case_id: caseA_id,
      document_name: 'Prosecution_Sanction_Order.pdf',
      document_type: 'Legal Opinion',
      uploaded_by: legal.id,
      metadata: { recommendation: 'Sanction under Sec 218 BNS granted', status: 'Approved' }
    });
    recordResult(
      'LEGAL', 'LEGAL_DOCUMENTS', 'Upload prosecution / legal scrutiny document',
      'ALLOW',
      !legInsErr ? 'ALLOWED' : `DENIED (${legInsErr?.message})`,
      !legInsErr ? 'PASS' : 'FAIL'
    );

    // AI Legal Search
    const legalSearchRes = await callApi('/api/ai/legal-search', 'POST', {
      query: 'Lalita Kumari mandatory FIR registration 173 BNSS'
    }, legal.jwt);
    recordResult(
      'LEGAL', 'AI', 'Use Legal Precedent Search (/api/ai/legal-search)',
      'ALLOW (200)',
      legalSearchRes.status === 200 ? 'ALLOWED (200)' : `STATUS ${legalSearchRes.status}`,
      legalSearchRes.status === 200 ? 'PASS' : 'FAIL'
    );

    // FORBIDDEN: Alter original FIR facts
    const { error: altFirAsLegal } = await legal.client.from('case_documents').update({
      document_name: 'Altered_FIR_By_Legal.pdf'
    }).eq('id', docFIR_id);
    recordResult(
      'LEGAL', 'FIR', 'Alter original FIR facts / document',
      'DENY',
      !altFirAsLegal ? 'ALLOWED (Prosecution counsel edited original FIR!)' : `DENIED (${altFirAsLegal?.message})`,
      !altFirAsLegal ? 'FAIL' : 'PASS'
    );

    // FORBIDDEN: Delete Police Investigation records
    const { error: delPoliceDocAsLegal } = await legal.client.from('case_documents').delete().eq('id', docWitness_id);
    recordResult(
      'LEGAL', 'DOCUMENTS', 'Delete police investigation records',
      'DENY',
      !delPoliceDocAsLegal ? 'ALLOWED (Prosecution deleted police witness statement!)' : `DENIED (${delPoliceDocAsLegal?.message})`,
      !delPoliceDocAsLegal ? 'FAIL' : 'PASS'
    );
  }

  // =========================================================================
  // TEST SECTION 4: JUDICIAL / COURT USER (READ-ONLY)
  // =========================================================================
  console.log('\n=============================================================');
  console.log('TESTING ROLE 4: JUDICIAL / COURT USER');
  console.log('=============================================================');

  {
    // CRITICAL TEST: INSERT against case table
    const { error: judCaseIns } = await judicial.client.from('cases').insert({
      id: 'c0000000-0000-4000-a000-000000000055',
      case_id: 'JUD-ILLEGAL-CASE',
      title: 'Illegal Case by Court'
    });
    recordResult(
      'JUDICIAL', 'CASE', 'Direct INSERT into cases table (CRITICAL TEST)',
      'DENY (403 / RLS Permission Denied)',
      !judCaseIns ? 'ALLOWED (Judicial user created a case!)' : `DENIED (${judCaseIns?.message})`,
      !judCaseIns ? 'FAIL' : 'PASS',
      'Judicial role is strictly READ-ONLY.'
    );

    // CRITICAL TEST: UPDATE against case table
    const { error: judCaseUpd } = await judicial.client.from('cases').update({
      title: 'Hacked Case Title'
    }).eq('id', caseA_id);
    recordResult(
      'JUDICIAL', 'CASE', 'Direct UPDATE on cases table (CRITICAL TEST)',
      'DENY (403 / RLS Permission Denied)',
      !judCaseUpd ? 'ALLOWED (Judicial user modified case details!)' : `DENIED (${judCaseUpd?.message})`,
      !judCaseUpd ? 'FAIL' : 'PASS'
    );

    // CRITICAL TEST: DELETE against case table
    const { error: judCaseDel } = await judicial.client.from('cases').delete().eq('id', caseA_id);
    recordResult(
      'JUDICIAL', 'CASE', 'Direct DELETE on cases table (CRITICAL TEST)',
      'DENY (403 / RLS Permission Denied)',
      !judCaseDel ? 'ALLOWED (Judicial user deleted case!)' : `DENIED (${judCaseDel?.message})`,
      !judCaseDel ? 'FAIL' : 'PASS'
    );

    // CRITICAL TEST: Direct INSERT into case_documents
    const { error: judDocIns } = await judicial.client.from('case_documents').insert({
      id: 'd0000000-0000-4000-b000-000000000055',
      case_id: caseA_id,
      document_name: 'Illegal_Court_Upload.pdf',
      uploaded_by: judicial.id
    });
    recordResult(
      'JUDICIAL', 'DOCUMENTS', 'Direct INSERT into case_documents (CRITICAL TEST)',
      'DENY (403 / RLS Permission Denied)',
      !judDocIns ? 'ALLOWED (Judicial user uploaded document directly)' : `DENIED (${judDocIns?.message})`,
      !judDocIns ? 'FAIL' : 'PASS'
    );

    // CRITICAL TEST: Storage upload
    const judStUp = await judicial.client.storage.from('case-documents').upload('case-A/jud_test.txt', Buffer.from('Illegal Court file'));
    recordResult(
      'JUDICIAL', 'STORAGE', 'Direct upload to Supabase Storage',
      'DENY (403 / Storage RLS violation)',
      !judStUp.error ? 'ALLOWED (Judicial user uploaded file to storage!)' : `DENIED (${judStUp.error?.message})`,
      !judStUp.error ? 'FAIL' : 'PASS'
    );

    // View finalized court documents
    const { data: courtDocs } = await judicial.client.from('case_documents').select('*').eq('id', docCourt_id);
    recordResult(
      'JUDICIAL', 'DOCUMENTS', 'View finalized court submitted document',
      'ALLOW',
      courtDocs?.length > 0 ? 'ALLOWED' : 'DENIED',
      courtDocs?.length > 0 ? 'PASS' : 'FAIL'
    );
  }

  // =========================================================================
  // TEST SECTION 5: SYSTEM ADMINISTRATOR
  // =========================================================================
  console.log('\n=============================================================');
  console.log('TESTING ROLE 5: SYSTEM ADMINISTRATOR');
  console.log('=============================================================');

  {
    // View Audit Logs
    const { data: adminAudits, error: audErr } = await sysAdmin.client.from('audit_logs').select('*').limit(5);
    recordResult(
      'ADMIN', 'AUDIT', 'View system audit logs',
      'ALLOW',
      adminAudits?.length >= 0 && !audErr ? `ALLOWED (${adminAudits?.length} logs)` : `DENIED (${audErr?.message})`,
      !audErr ? 'PASS' : 'FAIL'
    );

    // View Users / Profiles
    const { data: userProfiles, error: profErr } = await sysAdmin.client.from('profiles').select('*').limit(10);
    recordResult(
      'ADMIN', 'USER_MANAGEMENT', 'View user profiles',
      'ALLOW',
      userProfiles?.length > 0 ? `ALLOWED (${userProfiles.length} profiles)` : `DENIED (${profErr?.message})`,
      userProfiles?.length > 0 ? 'PASS' : 'FAIL'
    );

    // Change User Role (Admin assigning role to user)
    const { error: chRoleErr } = await sysAdmin.client.from('profiles').update({
      role: 'Legal Officer'
    }).eq('id', legal.id);
    recordResult(
      'ADMIN', 'USER_MANAGEMENT', 'Assign / update user role',
      'ALLOW',
      !chRoleErr ? 'ALLOWED' : `DENIED (${chRoleErr?.message})`,
      !chRoleErr ? 'PASS' : 'FAIL'
    );

    // CRITICAL: ADMIN IS NOT INVESTIGATING OFFICER
    // "Admin should NOT automatically have unrestricted ability to modify FIR facts"
    const { error: adminFirMod } = await sysAdmin.client.from('case_documents').update({
      document_name: 'Admin_Overridden_FIR.pdf',
      extracted_text: 'Admin modified original FIR facts without case assignment'
    }).eq('id', docFIR_id);
    recordResult(
      'ADMIN', 'FIR', 'Modify FIR facts without authorized case assignment',
      'DENY (Admin is system administrator, not investigating officer)',
      !adminFirMod ? 'ALLOWED (Admin modified FIR directly!)' : `DENIED (${adminFirMod?.message})`,
      !adminFirMod ? 'FAIL' : 'PASS',
      'System Admin is NOT Investigating Officer; cannot tamper with FIR facts.'
    );

    // Tamper with Audit history (Even Admin must NOT alter immutable audit logs)
    const { data: aItem } = await admin.from('audit_logs').select('id').limit(1);
    if (aItem?.[0]) {
      const { error: adminDelAudit } = await sysAdmin.client.from('audit_logs').delete().eq('id', aItem[0].id);
      recordResult(
        'ADMIN', 'AUDIT', 'Delete or tamper with audit history',
        'DENY (Audit log must be immutable and append-only even for Admin)',
        !adminDelAudit ? 'ALLOWED (Admin deleted audit history!)' : `DENIED (${adminDelAudit?.message})`,
        !adminDelAudit ? 'FAIL' : 'PASS',
        'Audit logs must be write-only / append-only; deletion must be rejected.'
      );
    }
  }

  // =========================================================================
  // TEST SECTION 6: CASE-LEVEL ACCESS & JURISDICTION SEPARATION
  // =========================================================================
  console.log('\n=============================================================');
  console.log('TESTING CASE-LEVEL ACCESS & JURISDICTION SEPARATION');
  console.log('=============================================================');

  {
    // Test: Forensic-1 accessing Case B (Homicide case assigned strictly to IO-2)
    const { data: forensicCaseB, error: fcErr } = await forensic.client.from('cases').select('*').eq('id', caseB_id);
    const forensicSawCaseB = forensicCaseB && forensicCaseB.length > 0;
    recordResult(
      'FORENSIC', 'CASE_LEVEL', 'Forensic-1 accessing unassigned Case B',
      'DENY (Forensic-1 is only assigned to Case A, must NOT see Case B)',
      forensicSawCaseB ? 'ALLOWED (Forensic-1 accessed Case B data!)' : 'DENIED (Case B isolated)',
      forensicSawCaseB ? 'FAIL' : 'PASS',
      'Forensic officer should only access assigned/requisitioned cases.'
    );

    // Test: Forensic-1 accessing Case B Documents
    const { data: forensicCaseBDocs } = await forensic.client.from('case_documents').select('*').eq('case_id', caseB_id);
    const forensicSawCaseBDocs = forensicCaseBDocs && forensicCaseBDocs.length > 0;
    recordResult(
      'FORENSIC', 'CASE_LEVEL', 'Forensic-1 accessing Case B documents',
      'DENY',
      forensicSawCaseBDocs ? 'ALLOWED (Forensic-1 saw Case B sensitive documents!)' : 'DENIED (Documents protected)',
      forensicSawCaseBDocs ? 'FAIL' : 'PASS'
    );

    // Test: IO-1 accessing Case B Documents
    const { data: io1CaseBDocs } = await io1.client.from('case_documents').select('*').eq('case_id', caseB_id);
    const io1SawCaseBDocs = io1CaseBDocs && io1CaseBDocs.length > 0;
    recordResult(
      'POLICE_IO', 'CASE_LEVEL', 'IO-1 accessing IO-2 unassigned Case B documents',
      'DENY / WARNING (Case-level assignment check)',
      io1SawCaseBDocs ? 'ALLOWED (IO-1 saw all documents in Case B)' : 'DENIED (Restricted to assigned)',
      io1SawCaseBDocs ? 'FAIL' : 'PASS'
    );

    // Test: Judicial user viewing unfinalized / internal investigation drafts in Case A
    const { data: judDraftDocs } = await judicial.client.from('case_documents').select('*').eq('id', docWitness_id);
    const judSawInternalDraft = judDraftDocs && judDraftDocs.length > 0;
    recordResult(
      'JUDICIAL', 'CASE_LEVEL', 'Judicial viewing internal draft witness statement (not finalized for court)',
      'DENY (Judicial user must only see finalized court-submitted documents)',
      judSawInternalDraft ? 'ALLOWED (Judicial saw internal draft witness statement!)' : 'DENIED',
      judSawInternalDraft ? 'FAIL' : 'PASS'
    );
  }

  // =========================================================================
  // TEST SECTION 7: AUDIT SECURITY TEST
  // =========================================================================
  console.log('\n=============================================================');
  console.log('TESTING AUDIT SECURITY & LOGGING INTEGRITY');
  console.log('=============================================================');

  {
    // 1. Log an authorized action
    const auditId = 'a0000000-0000-4000-c000-000000000001';
    const { error: insAudErr } = await io1.client.from('audit_logs').insert({
      id: auditId,
      user_id: io1.id,
      user_name: io1.fullName,
      action: 'CASE_VIEWED',
      case_id: caseA_strId,
      status: 'SUCCESS',
      details: 'Officer accessed case workspace'
    });
    recordResult(
      'POLICE_IO', 'AUDIT', 'Record allowed action in audit logs',
      'ALLOW (Audit row created)',
      !insAudErr ? 'ALLOWED' : `FAILED (${insAudErr?.message})`,
      !insAudErr ? 'PASS' : 'FAIL'
    );

    // 2. Can ordinary user update audit log?
    const { error: upAud } = await io1.client.from('audit_logs').update({
      action: 'CLEARED_RECORD'
    }).eq('id', auditId);
    recordResult(
      'POLICE_IO', 'AUDIT', 'Direct UPDATE on audit_logs table',
      'DENY (Audit must be immutable)',
      !upAud ? 'ALLOWED (Audit row updated by user!)' : `DENIED (${upAud?.message})`,
      !upAud ? 'FAIL' : 'PASS'
    );

    // 3. Can ordinary user delete audit log?
    const { error: delAud } = await io1.client.from('audit_logs').delete().eq('id', auditId);
    recordResult(
      'POLICE_IO', 'AUDIT', 'Direct DELETE on audit_logs table',
      'DENY (Audit must be permanent)',
      !delAud ? 'ALLOWED (Audit row deleted by user!)' : `DENIED (${delAud?.message})`,
      !delAud ? 'FAIL' : 'PASS'
    );
  }

  // =========================================================================
  // TEST SECTION 8: BACKEND API ENDPOINT SECURITY
  // =========================================================================
  console.log('\n=============================================================');
  console.log('TESTING BACKEND API ENDPOINT AUTHORIZATION');
  console.log('=============================================================');

  {
    // Test unauthenticated call to /api/auth/verify
    const unauthVerify = await callApi('/api/auth/verify', 'GET', null, null);
    recordResult(
      'UNAUTHENTICATED', 'BACKEND_API', 'Call requireAuth endpoint without token (/api/auth/verify)',
      'DENY (401 Unauthorized)',
      unauthVerify.status === 401 ? 'DENIED (401 Unauthorized)' : `STATUS ${unauthVerify.status}`,
      unauthVerify.status === 401 ? 'PASS' : 'FAIL'
    );

    // Test Judicial calling /api/fir/generate directly
    const judGenFir = await callApi('/api/fir/generate', 'POST', {
      firNumber: 'ILLEGAL-JUD-FIR',
      complainantName: 'Illegal Complainant'
    }, judicial.jwt);
    recordResult(
      'JUDICIAL', 'BACKEND_API', 'Direct call to /api/fir/generate by Judicial user',
      'DENY (403 Forbidden)',
      judGenFir.status === 403 ? 'DENIED (403)' : `ALLOWED (${judGenFir.status} returned)`,
      judGenFir.status === 403 ? 'PASS' : 'FAIL',
      'Judicial role should not be authorized to invoke FIR generation endpoints.'
    );

    // Test Forensic calling /api/fir/generate directly
    const forGenFir = await callApi('/api/fir/generate', 'POST', {
      firNumber: 'ILLEGAL-FOR-FIR',
      complainantName: 'Forensic Complainant'
    }, forensic.jwt);
    recordResult(
      'FORENSIC', 'BACKEND_API', 'Direct call to /api/fir/generate by Forensic officer',
      'DENY (403 Forbidden)',
      forGenFir.status === 403 ? 'DENIED (403)' : `ALLOWED (${forGenFir.status} returned)`,
      forGenFir.status === 403 ? 'PASS' : 'FAIL',
      'Forensic officer should not generate police FIRs.'
    );

    // Test delete document via backend API (/api/documents/:id) without authorization
    const judDelDocApi = await callApi(`/api/documents/${docWitness_id}`, 'DELETE', null, judicial.jwt);
    recordResult(
      'JUDICIAL', 'BACKEND_API', 'Direct call to DELETE /api/documents/:id by Judicial user',
      'DENY (403 Forbidden)',
      judDelDocApi.status === 403 || judDelDocApi.status === 401 ? `DENIED (${judDelDocApi.status})` : `ALLOWED (${judDelDocApi.status})`,
      (judDelDocApi.status === 403 || judDelDocApi.status === 401) ? 'PASS' : 'FAIL'
    );
  }

  // Cleanup test fixtures
  console.log('\n--- CLEANING UP TEST FIXTURES ---');
  await admin.from('case_documents').delete().eq('case_id', caseA_id);
  await admin.from('case_documents').delete().eq('case_id', caseB_id);
  await admin.from('cases').delete().eq('id', caseA_id);
  await admin.from('cases').delete().eq('id', caseB_id);
  await admin.from('cases').delete().eq('id', 'c0000000-0000-4000-a000-000000000099');
  console.log('Cleanup complete.');

  import('fs').then(fs => {
    fs.writeFileSync('rbac_test_results.json', JSON.stringify(results, null, 2));
  });

  return results;
}

runSecurityTest().then(testResults => {
  console.log('\n=============================================================');
  console.log('RBAC SECURITY TEST EXECUTION COMPLETE');
  console.log('Total Tests Executed:', testResults.length);
  console.log('PASS Count:', testResults.filter(r => r.result === 'PASS').length);
  console.log('FAIL Count:', testResults.filter(r => r.result === 'FAIL').length);
  console.log('WARNING Count:', testResults.filter(r => r.result === 'WARNING').length);
  console.log('=============================================================');
}).catch(e => {
  console.error('Test execution failed with exception:', e);
});
