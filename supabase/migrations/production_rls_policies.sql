-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔒 PRODUCTION RLS POLICIES
-- 
-- This file tightens Row Level Security for production deployment
-- 
-- CURRENT STATE: 'anon' role has full access (development setup)
-- TARGET STATE: 'authenticated' role with proper restrictions
-- 
-- ⚠️ RUN THIS BEFORE PRODUCTION DEPLOYMENT!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Drop all 'anon' policies (too permissive)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE '%anon%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
  END LOOP;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Create authenticated user policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ✅ CUSTOMERS TABLE
CREATE POLICY "authenticated_select_customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);  -- All authenticated users can read

CREATE POLICY "authenticated_insert_customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- ✅ PRODUCTS TABLE
CREATE POLICY "authenticated_select_products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- ✅ BANK_PF TABLE
CREATE POLICY "authenticated_select_bank_pf"
  ON bank_pf FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_bank_pf"
  ON bank_pf FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_bank_pf"
  ON bank_pf FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_bank_pf"
  ON bank_pf FOR DELETE
  TO authenticated
  USING (true);

-- ✅ SIGNS TABLE (TABELA)
CREATE POLICY "authenticated_select_signs"
  ON signs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_signs"
  ON signs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_signs"
  ON signs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_signs"
  ON signs FOR DELETE
  TO authenticated
  USING (true);

-- ✅ EARNINGS TABLE (HAKEDİŞ)
CREATE POLICY "authenticated_select_earnings"
  ON earnings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_earnings"
  ON earnings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_earnings"
  ON earnings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_earnings"
  ON earnings FOR DELETE
  TO authenticated
  USING (true);

-- ✅ MCC_CODES TABLE
CREATE POLICY "authenticated_select_mcc_codes"
  ON mcc_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_mcc_codes"
  ON mcc_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_mcc_codes"
  ON mcc_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_mcc_codes"
  ON mcc_codes FOR DELETE
  TO authenticated
  USING (true);

-- ✅ BANKS TABLE
CREATE POLICY "authenticated_select_banks"
  ON banks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_banks"
  ON banks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_banks"
  ON banks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_banks"
  ON banks FOR DELETE
  TO authenticated
  USING (true);

-- ✅ EPK_LIST TABLE
CREATE POLICY "authenticated_select_epk_list"
  ON epk_list FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_epk_list"
  ON epk_list FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_epk_list"
  ON epk_list FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_epk_list"
  ON epk_list FOR DELETE
  TO authenticated
  USING (true);

-- ✅ OK_LIST TABLE
CREATE POLICY "authenticated_select_ok_list"
  ON ok_list FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_ok_list"
  ON ok_list FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_ok_list"
  ON ok_list FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_ok_list"
  ON ok_list FOR DELETE
  TO authenticated
  USING (true);

-- ✅ SALES_REPRESENTATIVES TABLE
CREATE POLICY "authenticated_select_sales_representatives"
  ON sales_representatives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_sales_representatives"
  ON sales_representatives FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_sales_representatives"
  ON sales_representatives FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_sales_representatives"
  ON sales_representatives FOR DELETE
  TO authenticated
  USING (true);

-- ✅ JOB_TITLES TABLE
CREATE POLICY "authenticated_select_job_titles"
  ON job_titles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_job_titles"
  ON job_titles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_job_titles"
  ON job_titles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_job_titles"
  ON job_titles FOR DELETE
  TO authenticated
  USING (true);

-- ✅ PARTNERSHIPS TABLE
CREATE POLICY "authenticated_select_partnerships"
  ON partnerships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_partnerships"
  ON partnerships FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_partnerships"
  ON partnerships FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_partnerships"
  ON partnerships FOR DELETE
  TO authenticated
  USING (true);

-- ✅ SHARINGS TABLE
CREATE POLICY "authenticated_select_sharings"
  ON sharings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_sharings"
  ON sharings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_sharings"
  ON sharings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_sharings"
  ON sharings FOR DELETE
  TO authenticated
  USING (true);

-- ✅ KART_PROGRAMS TABLE
CREATE POLICY "authenticated_select_kart_programs"
  ON kart_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_kart_programs"
  ON kart_programs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_kart_programs"
  ON kart_programs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_kart_programs"
  ON kart_programs FOR DELETE
  TO authenticated
  USING (true);

-- ✅ SUSPENSION_REASONS TABLE
CREATE POLICY "authenticated_select_suspension_reasons"
  ON suspension_reasons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_suspension_reasons"
  ON suspension_reasons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_suspension_reasons"
  ON suspension_reasons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_suspension_reasons"
  ON suspension_reasons FOR DELETE
  TO authenticated
  USING (true);

-- ✅ DOMAIN_MAPPINGS TABLE
CREATE POLICY "authenticated_select_domain_mappings"
  ON domain_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_domain_mappings"
  ON domain_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_domain_mappings"
  ON domain_mappings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_domain_mappings"
  ON domain_mappings FOR DELETE
  TO authenticated
  USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DSYM TABLES (Dijital Sözleşme Yönetim Modülü)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ✅ CONTRACT_TEMPLATES TABLE
CREATE POLICY "authenticated_all_contract_templates"
  ON contract_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ CONTRACTS TABLE
CREATE POLICY "authenticated_all_contracts"
  ON contracts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ CONTRACT_TRANSACTIONS TABLE
CREATE POLICY "authenticated_all_contract_transactions"
  ON contract_transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ EMAIL_TEMPLATES TABLE
CREATE POLICY "authenticated_all_email_templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ SMS_TEMPLATES TABLE
CREATE POLICY "authenticated_all_sms_templates"
  ON sms_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ TEMPLATE_CATEGORIES TABLE
CREATE POLICY "authenticated_all_template_categories"
  ON template_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ TEMPLATE_VARIABLES TABLE
CREATE POLICY "authenticated_all_template_variables"
  ON template_variables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: Verify policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  policy_count INTEGER;
  anon_policy_count INTEGER;
BEGIN
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count anon policies (should be 0)
  SELECT COUNT(*) INTO anon_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE '%anon%';
  
  RAISE NOTICE '✅ Total policies created: %', policy_count;
  RAISE NOTICE '✅ Anon policies remaining: % (should be 0)', anon_policy_count;
  
  IF anon_policy_count > 0 THEN
    RAISE WARNING '⚠️ Some anon policies still exist! Manual cleanup required.';
  ELSE
    RAISE NOTICE '✅ All anon policies removed successfully!';
  END IF;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4: Create helper function to check user permissions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION check_user_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_authenticated() IS 
'Helper function to check if current user is authenticated';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTES:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- 1. This migration removes 'anon' role access completely
-- 2. All operations now require authenticated user
-- 3. After running this, authBypass WILL NOT WORK (need real Supabase auth)
-- 4. Test thoroughly in preview environment before production!
--
-- TO REVERT (if needed):
-- Run the original anon policies from your backup
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
