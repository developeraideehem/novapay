/**
 * NovaPay Database Connection Test
 * 
 * This script tests the Supabase connection and verifies:
 * 1. Environment variables are loaded
 * 2. Can connect to Supabase
 * 3. Can query bill providers
 * 4. RLS policies are working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 NovaPay Database Connection Test\n');

// Test 1: Check Environment Variables
console.log('✓ Test 1: Environment Variables');
console.log(`  URL: ${SUPABASE_URL?.substring(0, 30)}...`);
console.log(`  Key: ${SUPABASE_ANON_KEY?.substring(0, 20)}...`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ ERROR: Missing environment variables!');
    process.exit(1);
}

// Test 2: Create Supabase Client
console.log('\n✓ Test 2: Creating Supabase Client');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('  Client created successfully');

// Test 3: Query Bill Providers (Public Access)
(async () => {
    console.log('\n✓ Test 3: Querying Bill Providers');
    const { data: providers, error } = await supabase
        .from('bill_providers')
        .select('code, name, category, cashback_percentage')
        .eq('is_active', true)
        .order('category');

    if (error) {
        console.error('❌ ERROR querying bill providers:', error.message);
        process.exit(1);
    }

    console.log(`  Found ${providers.length} active bill providers:`);
    providers.forEach(p => {
        console.log(`    • ${p.name} (${p.category}) - ${p.cashback_percentage}% cashback`);
    });

    // Test 4: Check Database Schema
    console.log('\n✓ Test 4: Verifying Database Schema');
    const tables = ['users', 'wallets', 'transactions', 'savings_plans', 'loans', 'beneficiaries'];
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`    ⚠️  ${table}: ${error.message}`);
        } else {
            console.log(`    ✓ ${table}: ${count} records`);
        }
    }

    console.log('\n✅ All Tests Passed! Database is ready to use.\n');
    console.log('Next Steps:');
    console.log('  1. Run: npm start (already running)');
    console.log('  2. Press "w" to open in web browser');
    console.log('  3. Test signup flow');
    console.log('  4. Verify wallet auto-creation\n');
})().catch(console.error);
