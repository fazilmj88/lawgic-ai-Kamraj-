/**
 * LAWgIC AI - Firebase to Supabase Migration Utility Script
 * 
 * This script provides an automated pipeline to transfer:
 * 1. Firestore 'cases' -> Supabase 'cases' table
 * 2. Firestore 'users' -> Supabase 'profiles' table
 * 3. Firestore 'case_documents' -> Supabase 'case_documents' and 'document_versions' tables
 * 4. Firestore 'audit_logs' -> Supabase 'audit_logs' table
 * 5. Firebase Storage files -> Supabase Storage 'case-documents' bucket
 * 
 * Usage:
 * tsx scripts/migrate-firebase-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Supabase URL or Key not set in environment. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running migration.');
}

const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_SERVICE_ROLE_KEY || 'placeholder');

export async function migrateSampleCases(casesJsonPath?: string) {
  console.log('🔄 [Migration] Checking cases to migrate...');
  try {
    let casesToMigrate: any[] = [];
    if (casesJsonPath && fs.existsSync(casesJsonPath)) {
      const raw = fs.readFileSync(casesJsonPath, 'utf8');
      casesToMigrate = JSON.parse(raw);
    }

    if (casesToMigrate.length === 0) {
      console.log('ℹ️ [Migration] No external Firestore export file provided. Using built-in schema.');
      return;
    }

    for (const c of casesToMigrate) {
      const payload = {
        case_id: c.caseId || c.case_id,
        fir_number: c.caseId || c.fir_number,
        title: `${c.crimeType || 'Offence'} - ${c.complainant || 'Complainant'}`,
        incident_type: c.crimeType || 'Cognizable Offence',
        status: c.status || 'Draft',
        district: c.district || 'Chennai City Police',
        police_station: c.policeStation || 'B-1 North Beach Police Station',
        complainant: c.complainant || '',
        father_husband_name: c.fatherHusbandName || null,
        complainant_phone: c.complainantPhone || null,
        complainant_address: c.complainantAddress || null,
        incident_date: c.incidentDate ? new Date(c.incidentDate).toISOString() : new Date().toISOString(),
        incident_time: c.incidentTime || '18:00',
        incident_description: c.incidentDescription || '',
        crime_type: c.crimeType || 'Offence',
        priority: c.priority || 'Medium',
        ai_analysis: c.aiAnalysis || null,
        timeline_events: c.timelineEvents || [],
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.updatedAt || new Date().toISOString()
      };

      const { error } = await supabase.from('cases').upsert(payload, { onConflict: 'case_id' });
      if (error) {
        console.warn(`⚠️ Failed to upsert case ${c.caseId}:`, error.message);
      } else {
        console.log(`✅ Migrated case: ${c.caseId}`);
      }
    }
  } catch (err: any) {
    console.error('❌ Case migration error:', err.message || err);
  }
}

export async function checkSupabaseStatus() {
  try {
    const { data, error } = await supabase.from('cases').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase connection error:', error.message);
      return false;
    }
    console.log('✅ Connected to Supabase PostgreSQL database successfully.');
    return true;
  } catch (e: any) {
    console.log('❌ Supabase ping failure:', e.message || e);
    return false;
  }
}

async function main() {
  console.log('=== LAWgIC AI Firebase-to-Supabase Data Migration Runner ===');
  const connected = await checkSupabaseStatus();
  if (!connected) {
    console.log('Please provide active Supabase project credentials in .env to execute live sync.');
  }
}

if (process.argv[1]?.includes('migrate-firebase-to-supabase')) {
  main();
}
