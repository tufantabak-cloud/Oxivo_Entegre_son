// Müşteri Yönetim Uygulaması - App v1.0.27
// Supabase entegre, çok modüllü yönetim sistemi
// Detaylı version history için CHANGELOG.md dosyasına bakınız
import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useDefinitionStore } from './hooks/useDefinitionStore';
import { useRoute } from './utils/routingHelper';
import { Customer } from './components/CustomerModule';
import { BankPF } from './components/BankPFModule';
import { TabelaRecord, TabelaGroup } from './components/TabelaTab';
import { PayterProduct } from './components/PayterProductTab';
import { logger, createTimer } from './utils/logger';
import { ENV_CONFIG, FEATURE_FLAGS } from './utils/environmentConfig';
import { getStoredData, setStoredData } from './utils/storage';
import { migrateData, validateImportData } from './utils/dataMigration';
import { syncToSupabase } from './utils/supabaseSync';
import { syncAllData } from './utils/autoSync';
import { supabase } from './utils/supabaseClient';
import { FeatureFlags } from './utils/featureFlags';
import { isSilentMode } from './utils/environmentDetection';
import { SupabaseSchemaChecker } from './components/SupabaseSchemaChecker';

// ✅ CRITICAL: Import Supabase API helpers (Original v2071)
import { 
  customerApi, 
  productApi, 
  bankPFApi,
  mccCodesApi,
  banksApi,
  epkListApi,
  okListApi,
  salesRepsApi,
  jobTitlesApi,
  partnershipsApi,
  sharingApi,
  kartProgramApi,
  suspensionReasonApi,
  signApi,
  earningsApi,
  domainMappingApi,
  SUPABASE_ENABLED
} from './utils/supabaseClient';

// ⚡ PHASE 3: Code Splitting - Lazy load heavy modules
const CustomerModule = lazy(() => import('./components/CustomerModule').then(m => ({ default: m.CustomerModule })));
const BankPFModule = lazy(() => import('./components/BankPFModule').then(m => ({ default: m.BankPFModule })));
const ReportsModule = lazy(() => import('./components/ReportsModule').then(m => ({ default: m.ReportsModule })));
const ProductModule = lazy(() => import('./components/ProductModule').then(m => ({ default: m.ProductModule })));
const RevenueModule = lazy(() => import('./components/RevenueModule').then(m => ({ default: m.RevenueModule })));
const DefinitionsModule = lazy(() => import('./components/DefinitionsModule').then(m => ({ default: m.DefinitionsModule })));
// ⚡ CRITICAL FIX: Dashboard lazy load (14 widget components inside!)
const DashboardHome = lazy(() => import('./components/DashboardHome').then(m => ({ default: m.DashboardHome })));
// ⚡ DSYM Module - Dijital Sözleşme Yönetim Modülü
const DSYMModule = lazy(() => import('./components/DSYMModule'));
const ContractPublicView = lazy(() => import('./components/DSYM/ContractPublicView'));
// ⚡ Supabase Data Inspector - Real-time Veri Takip Paneli
const SupabaseDataInspector = lazy(() => import('./components/SupabaseDataInspector'));
// ⚡ Supabase Full Migration - localStorage'dan Supabase'e veri aktarımı
const SupabaseFullMigration = lazy(() => import('./components/SupabaseFullMigration').then(m => ({ default: m.SupabaseFullMigration })));
// ❌ REMOVED: Migration Tool - Already migrated to Supabase
// const MigrationRunner = ENV_CONFIG.enableMigrationTools 
//   ? lazy(() => import('./utils/migrationRunner').then(m => ({ default: m.MigrationRunner })))
//   : null;

// Type imports (not lazy loaded)
import type { 
  JobTitle, 
  MCC,
  Bank,
  EPK,
  OK,
  Partnership,
  Sharing,
  KartProgram,
  HesapKalemi,
  SabitKomisyon,
  EkGelir,
  SalesRepresentative,
  SuspensionReason
} from './components/DefinitionsModule';

// Default data imports (needed for initialization)
import {
  defaultJobTitles,
  defaultMCCList,
  defaultBanks,
  defaultEPKList,
  defaultOKList,
  defaultPartnerships,
  defaultSharings,
  defaultKartProgramlar,
  defaultSalesRepresentatives,
  defaultSuspensionReasons
} from './components/DefinitionsModule';

// ⚡ CRITICAL FIX: Lazy load utility components
const ExcelDataManager = lazy(() => import('./components/ExcelDataManager').then(m => ({ default: m.ExcelDataManager })));
const GlobalSearch = lazy(() => import('./components/GlobalSearch').then(m => ({ default: m.GlobalSearch })));
const ActivityLogViewer = lazy(() => import('./components/ActivityLogViewer').then(m => ({ default: m.ActivityLogViewer })));
import { useGlobalSearch } from './hooks/useGlobalSearch';
import { logActivity } from './utils/activityLog';
import { Home, Users, Building2, Settings, Package, FileText, CheckCircle, XCircle, Filter, Euro, Download, Upload, Search, Trash2, CreditCard, TrendingUp, BarChart3, PieChart, DollarSign, Target, Award, Activity, Menu, X, RefreshCw, FileSignature, LogOut, Database } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Skeleton } from './components/ui/skeleton';
// TEMPORARY: Using auth bypass until Supabase is configured
import { useAuth } from './utils/authBypass';
import { LoginPage } from './components/LoginPage';
import { EnvironmentBadge } from './components/EnvironmentBadge';
import { isFigmaMakeEnvironment } from './utils/environmentDetection';
import { initializeMockData } from './utils/mockData';

// ⚡ Loading fallback component for code splitting
const ModuleLoadingFallback = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

// ⚡ SSR-SAFE UTILITY: Güvenli sayı çıkarma (subtitle.split() NaN crash fix)
/**
 * String'in başındaki sayıyı güvenli şekilde çıkarır
 * @param text - Parse edilecek string (örn: "150 cihaz (P6X: 100)")
 * @returns Güvenli integer veya 0
 * @example
 * extractLeadingNumber("150 cihaz") → 150
 * extractLeadingNumber(undefined) → 0
 * extractLeadingNumber("abc") → 0
 */
function extractLeadingNumber(text: string | undefined): number {
  if (!text || typeof text !== 'string') return 0;
  const match = text.match(/^(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? 0 : num;
}

// Uygulama versiyonu (Detaylı değişiklikler için CHANGELOG.md'ye bakınız)
const CURRENT_APP_VERSION = '1.0.27';

// Version validation with fallback
if (!CURRENT_APP_VERSION) {
  logger.warn('CURRENT_APP_VERSION missing, fallback to default');
}

// Safe environment detection
const isDev = (() => {
  try {
    return import.meta.env?.DEV ?? false;
  } catch {
    return false;
  }
})();

export default function App() {
  // 🔍 SCHEMA CHECKER MODE - Debug mode to check Supabase schema
  const [showSchemaChecker, setShowSchemaChecker] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('schema_check') === 'true') {
      setShowSchemaChecker(true);
    }
  }, []);
  
  // Show Schema Checker if enabled
  if (showSchemaChecker) {
    return <SupabaseSchemaChecker />;
  }
  
  // ⚡ Track app mount time to prevent auto-sync during initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.__APP_MOUNT_TIME__) {
      window.__APP_MOUNT_TIME__ = Date.now();
    }
    
    // ✅ Initialize mock data for Figma Make environment
    if (isFigmaMakeEnvironment()) {
      console.log('🎨 Figma Make environment detected - Initializing mock data...');
      initializeMockData();
    }
    
    // ✅ Production ready - Supabase entegre sistem
    if (typeof window !== 'undefined') {
      console.log('🎯 Müşteri Yönetim Uygulaması v1.0.25 - Production Ready');
      if (SUPABASE_ENABLED) {
        console.log('✅ Supabase: ONLINE | Auth: ACTIVE | Storage: PERSISTENT');
      } else {
        console.log('🎨 Figma Make: DEMO MODE | Mock Data: LOADED | Storage: localStorage');
      }
    }
  }, []);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTHENTICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const { user, loading: authLoading, isAdmin, isViewer, signOut } = useAuth();

  // ✅ MANUAL LOGOUT CHECK: Override authBypass.tsx if needed
  const hasLoggedOut = typeof window !== 'undefined' && 
    sessionStorage.getItem('auth_logged_out') === 'true';

  // Watch user state changes (dev only)
  useEffect(() => {
    logger.debug('🔵 User state changed:', {
      user: user?.email || 'null',
      authLoading,
      hasLoggedOut,
      willShowLoginPage: hasLoggedOut || (!authLoading && !user)
    });
  }, [user, authLoading, hasLoggedOut]);

  // If explicitly logged out, force LoginPage
  if (hasLoggedOut) {
    logger.debug('🔵 hasLoggedOut=true, forcing LoginPage');
    return <LoginPage />;
  }

  // ✅ PRIORITY 2: Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  // If no user, show LoginPage
  if (!user) {
    logger.debug('🔵 user=null, showing LoginPage');
    return <LoginPage />;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // URL ROUTING (Context Menu & Deep Linking Support)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const route = useRoute();

  // activeModule her zaman 'home' ile başlamalı (Figma uyumu için)
  // Not: Diğer state'ler localStorage'dan yüklenir ama activeModule her seferinde sıfırlanır
  const [activeModule, setActiveModule] = useState('home');
  const [selectedBankPFId, setSelectedBankPFId] = useState<string | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // PHASE 2 OPTIMIZATION: useDefinitionStore hook
  // Consolidates 12 definition states into a single hook (reduces state declarations from 12 to 1)
  const definitions = useDefinitionStore();
  const { 
    jobTitles, setJobTitles,
    mccList, setMCCList,
    banks, setBanks,
    epkList, setEPKList,
    okList, setOKList,
    partnerships, setPartnerships,
    sharings, setSharings,
    kartProgramlar, setKartProgramlar,
    hesapKalemleri, setHesapKalemleri,
    sabitKomisyonlar, setSabitKomisyonlar,
    ekGelirler, setEkGelirler,
    salesReps, setSalesReps,
    suspensionReasons, setSuspensionReasons
  } = definitions;
  
  // ⚡ CRITICAL FIX: Empty initial state - load data AFTER first render
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payterProducts, setPayterProducts] = useState<PayterProduct[]>([]);
  const [bankPFRecords, setBankPFRecords] = useState<BankPF[]>([]);
  const [domainMappings, setDomainMappings] = useState<any[]>([]);
  const [signs, setSigns] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [supabaseDataLoaded, setSupabaseDataLoaded] = useState(false);
  
  // ✅ NEW: Fetch ALL data from Supabase on mount
  useEffect(() => {
    let isMounted = true; // ✅ Cleanup flag to prevent state updates after unmount
    
    const fetchAllDataFromSupabase = async () => {
      try {
        logger.info('🔄 Fetching all data from Supabase...');
        
        // ✅ NEW: Run schema validation in development (only if Supabase is enabled)
        if (process.env.NODE_ENV === 'development' && SUPABASE_ENABLED) {
          try {
            const { runSchemaCheck } = await import('./utils/supabaseSchemaValidator');
            const validationResults = await runSchemaCheck();
            if (!validationResults.isValid) {
              console.error('⚠️ Schema validation detected issues:', validationResults.criticalIssues);
            }
          } catch (validationError) {
            console.warn('⚠️ Schema validation failed, continuing with data fetch:', validationError);
          }
        }
        
        // Fetch all entities in parallel
        const [
          customersResult,
          productsResult,
          bankPFResult,
          mccCodesResult,
          banksResult,
          epkListResult,
          okListResult,
          salesRepsResult,
          jobTitlesResult,
          partnershipsResult,
          sharingResult,
          kartProgramResult,
          suspensionReasonResult,
          domainMappingsResult,
          signsResult,
          earningsResult
        ] = await Promise.all([
          customerApi.getAll(),
          productApi.getAll(),
          bankPFApi.getAll(),
          mccCodesApi.getAll(),
          banksApi.getAll(),
          epkListApi.getAll(),
          okListApi.getAll(),
          salesRepsApi.getAll(),
          jobTitlesApi.getAll(),
          partnershipsApi.getAll(),
          sharingApi.getAll(),
          kartProgramApi.getAll(),
          suspensionReasonApi.getAll(),
          domainMappingApi.getAll(),
          signApi.getAll(),
          earningsApi.getAll()
        ]);
        
        // ✅ Only update state if component is still mounted
        if (!isMounted) return;
        
        // Update state with fetched data
        if (customersResult.success && customersResult.data) {
          setCustomers(customersResult.data);
          logger.info(`✅ Loaded ${customersResult.data.length} customers from Supabase`);
          
          // 🔍 DEBUG: Tüm müşterilerin bankDeviceAssignments verilerini logla
          const customersWithBankAssignments = customersResult.data.filter(c => 
            c.bankDeviceAssignments && Array.isArray(c.bankDeviceAssignments) && c.bankDeviceAssignments.length > 0
          );
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔍 [App.tsx] TOPLAM MÜŞTERİ:', customersResult.data.length);
          console.log('🔍 [App.tsx] bankDeviceAssignments OLAN:', customersWithBankAssignments.length);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          if (customersWithBankAssignments.length > 0) {
            console.table(
              customersWithBankAssignments.map(c => ({
                'Müşteri': c.cariAdi,
                'Banka Sayısı': c.bankDeviceAssignments?.length || 0,
                'Cihaz Sayısı': c.bankDeviceAssignments?.reduce((sum, a) => sum + (a.deviceIds?.length || 0), 0) || 0,
                'Bankalar': c.bankDeviceAssignments?.map(a => a.bankName || a.bank_name).join(', ')
              }))
            );
          } else {
            console.log('⚠️ [App.tsx] Hiçbir müşteride bankDeviceAssignments verisi yok');
          }
        }
        
        console.log('🔍 [App.tsx] Products result:', {
          success: productsResult.success,
          dataLength: productsResult.data?.length,
          firstProduct: productsResult.data?.[0],
          lastProduct: productsResult.data?.[productsResult.data.length - 1],
          error: productsResult.error
        });
        
        if (productsResult.success && productsResult.data) {
          setPayterProducts(productsResult.data);
          logger.info(`✅ Loaded ${productsResult.data.length} products from Supabase`);
          
          // Show success toast if products were loaded (only on initial page load)
          if (productsResult.data.length > 0) {
            toast.success(`${productsResult.data.length.toLocaleString('tr-TR')} ürün Supabase'den yüklendi`, {
              duration: 3000,
            });
          }
        } else {
          // ✅ FIX: Better error handling for Figma Make environment
          if (productsResult.error === 'Supabase disabled in Figma Make' || productsResult.error === 'Supabase client not initialized' || productsResult.error === 'Supabase disabled') {
            logger.info('ℹ️ Products not loaded from Supabase (Figma Make environment - using localStorage)');
          } else {
            console.error('❌ [App.tsx] Failed to load products:', productsResult.error);
            logger.error(`❌ Failed to load products: ${productsResult.error}`);
          }
        }
        
        if (bankPFResult.success && bankPFResult.data) {
          // ✅ CRITICAL FIX: Integrate TABELA and EARNINGS records
          let enrichedBankPFRecords = bankPFResult.data;
          
          // ✅ SIGNS (TABELA) ENRICHMENT
          if (signsResult.success && signsResult.data) {
            const signsByFirmaId = new Map<string, TabelaRecord[]>();
            
            // Group signs by firmaId
            signsResult.data.forEach((sign: any) => {
              if (sign.firmaId) {
                const existing = signsByFirmaId.get(sign.firmaId) || [];
                signsByFirmaId.set(sign.firmaId, [...existing, sign as TabelaRecord]);
              }
            });
            
            // ✅ DEBUG: Mapping durumunu kontrol et
            console.log('🔍 [BankPF Enrichment] Sign kayıtları:', signsResult.data.length);
            console.log('🔍 [BankPF Enrichment] firmaId ile eşleşen signs:', signsByFirmaId.size);
            console.log('🔍 [BankPF Enrichment] BankPF kayıt sayısı:', bankPFResult.data.length);
            console.log('🔍 [BankPF Enrichment] BankPF ID örnekleri:', bankPFResult.data.slice(0, 3).map((bp: any) => ({
              id: bp.id,
              unvan: bp.firmaUnvan
            })));
            console.log('🔍 [BankPF Enrichment] Signs firmaId örnekleri:', [...new Set(signsResult.data.map((s: any) => s.firmaId).filter(Boolean))].slice(0, 5));
            console.log('🔍 [BankPF Enrichment] Mapping detayı:', Array.from(signsByFirmaId.entries()).map(([id, records]) => ({
              firmaId: id,
              recordCount: records.length
            })));
            
            // Attach tabelaRecords to each BankPF record
            enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
              ...bankPF,
              tabelaRecords: signsByFirmaId.get(bankPF.id) || bankPF.tabelaRecords || []
            }));
            
            const totalTabelaCount = signsResult.data.length;
            const mappedCount = Array.from(signsByFirmaId.values()).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`✅ Enriched with ${mappedCount}/${totalTabelaCount} TABELA records across ${signsByFirmaId.size} firms`);
            logger.info(`✅ Mapped ${mappedCount}/${totalTabelaCount} TABELA records to BankPF firms`);
          }
          
          // ✅ EARNINGS (HAKEDİŞ) ENRICHMENT - NEW!
          if (earningsResult.success && earningsResult.data) {
            const earningsByFirmaId = new Map<string, any[]>();
            
            // Group earnings by firmaId
            earningsResult.data.forEach((earning: any) => {
              if (earning.firmaId) {
                const existing = earningsByFirmaId.get(earning.firmaId) || [];
                earningsByFirmaId.set(earning.firmaId, [...existing, earning]);
              }
            });
            
            // Attach hakedisRecords to each BankPF record
            enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
              ...bankPF,
              hakedisRecords: earningsByFirmaId.get(bankPF.id) || bankPF.hakedisRecords || []
            }));
            
            const totalEarningsCount = earningsResult.data.length;
            const mappedEarningsCount = Array.from(earningsByFirmaId.values()).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`✅ Enriched with ${mappedEarningsCount}/${totalEarningsCount} EARNINGS records across ${earningsByFirmaId.size} firms`);
            logger.info(`✅ Mapped ${mappedEarningsCount}/${totalEarningsCount} EARNINGS records to BankPF firms`);
          }
          
          setBankPFRecords(enrichedBankPFRecords);
          logger.info(`✅ Loaded ${bankPFResult.data.length} bankPF records from Supabase`);
        }
        
        if (mccCodesResult.success && mccCodesResult.data) {
          setMCCList(mccCodesResult.data);
          logger.info(`✅ Loaded ${mccCodesResult.data.length} MCC codes from Supabase`);
        }
        
        if (banksResult.success && banksResult.data) {
          setBanks(banksResult.data);
          logger.info(`✅ Loaded ${banksResult.data.length} banks from Supabase`);
        }
        
        if (epkListResult.success && epkListResult.data) {
          setEPKList(epkListResult.data);
          logger.info(`✅ Loaded ${epkListResult.data.length} EPK entries from Supabase`);
        }
        
        if (okListResult.success && okListResult.data) {
          setOKList(okListResult.data);
          logger.info(`✅ Loaded ${okListResult.data.length} OK entries from Supabase`);
        }
        
        if (salesRepsResult.success && salesRepsResult.data) {
          setSalesReps(salesRepsResult.data);
          logger.info(`✅ Loaded ${salesRepsResult.data.length} sales reps from Supabase`);
        }
        
        if (jobTitlesResult.success && jobTitlesResult.data) {
          setJobTitles(jobTitlesResult.data);
          logger.info(`✅ Loaded ${jobTitlesResult.data.length} job titles from Supabase`);
        }
        
        if (partnershipsResult.success && partnershipsResult.data) {
          setPartnerships(partnershipsResult.data);
          logger.info(`✅ Loaded ${partnershipsResult.data.length} partnerships from Supabase`);
        }
        
        // ❌ REMOVED: accountItemsResult, fixedCommissionsResult, additionalRevenuesResult handling
        // These tables don't exist in Supabase
        
        if (sharingResult.success && sharingResult.data) {
          setSharings(sharingResult.data);
          logger.info(`✅ Loaded ${sharingResult.data.length} sharing records from Supabase`);
        }
        
        if (kartProgramResult.success && kartProgramResult.data) {
          setKartProgramlar(kartProgramResult.data);
          logger.info(`✅ Loaded ${kartProgramResult.data.length} kart program records from Supabase`);
        }
        
        if (suspensionReasonResult.success && suspensionReasonResult.data) {
          setSuspensionReasons(suspensionReasonResult.data);
          logger.info(`✅ Loaded ${suspensionReasonResult.data.length} suspension reason records from Supabase`);
          
          // 🔍 DEBUG: Verify 'reason' field mapping
          const firstReason = suspensionReasonResult.data[0];
          if (firstReason) {
            logger.debug('🔍 First suspension reason:', {
              id: firstReason.id,
              reason: firstReason.reason || '❌ MISSING!',
              neden: (firstReason as any).neden || 'not present (correct)',
              aktif: firstReason.aktif
            });
          }
        }
        
        if (domainMappingsResult.success && domainMappingsResult.data) {
          setDomainMappings(domainMappingsResult.data);
          logger.info(`✅ Loaded ${domainMappingsResult.data.length} domain mappings from Supabase`);
        }
        
        if (signsResult.success && signsResult.data) {
          setSigns(signsResult.data);
          logger.info(`✅ Loaded ${signsResult.data.length} signs from Supabase`);
          
          // 🔍 DEBUG: Signs firmaId kontrolü
          if (process.env.NODE_ENV === 'development' && signsResult.data.length > 0) {
            const firmaIds = signsResult.data.map((s: any) => s.firmaId).filter(Boolean);
            console.log('🔍 [App] Signs data:', {
              totalRecords: signsResult.data.length,
              withFirmaId: firmaIds.length,
              uniqueFirmaIds: [...new Set(firmaIds)].length,
              firstRecord: {
                id: signsResult.data[0].id,
                firmaId: signsResult.data[0].firmaId || '❌ MISSING!',
                firmaAdi: signsResult.data[0].firmaAdi
              },
              sampleFirmaIds: [...new Set(firmaIds)].slice(0, 5)
            });
          }
        }
        
        if (earningsResult.success && earningsResult.data) {
          setEarnings(earningsResult.data);
          logger.info(`✅ Loaded ${earningsResult.data.length} earnings from Supabase`);
          
          // 🔍 DEBUG: Earnings firmaId kontrolü
          if (process.env.NODE_ENV === 'development' && earningsResult.data.length > 0) {
            console.log('🔍 [App] First earning record:', {
              id: earningsResult.data[0].id,
              firmaId: earningsResult.data[0].firmaId || '❌ MISSING!',
              donem: earningsResult.data[0].donem,
              tabelaGroupId: earningsResult.data[0].tabelaGroupId
            });
          }
        }
        
        setSupabaseDataLoaded(true);
        logger.info('✅ All Supabase data loaded successfully');
        
      } catch (error) {
        logger.error('Error fetching data from Supabase:', error);
        // Fallback to localStorage if Supabase fails
        if (isMounted) {
          setSupabaseDataLoaded(true);
        }
      }
    };
    
    fetchAllDataFromSupabase();
    
    // ✅ Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);
  
  // ✅ SUPABASE-ONLY MODE: Mark data as loaded after Supabase fetch completes
  useEffect(() => {
    if (!supabaseDataLoaded) return;
    
    // ✅ SUPABASE-ONLY: Data loaded from Supabase, mark as ready
    logger.info('✅ Supabase data loaded, application ready');
    setDataLoaded(true);
  }, [supabaseDataLoaded]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUPABASE-ONLY MODE (No localStorage fallback)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ REMOVED: localStorage fallback - Application runs on Vercel (production-only)
  // All data must be in Supabase. Migration to Supabase completed.



  // ✅ NEW: Auto-sync ALL data types to Supabase (runs when ANY data changes)
  useEffect(() => {
    if (!dataLoaded) return;
    
    // ⚠️ CRITICAL FIX: Prevent auto-sync during initial data load from Supabase
    // This prevents React Error #426 (setState during render/concurrent updates)
    const INITIAL_LOAD_DELAY = 5000; // 5 seconds grace period
    const timeSinceMount = Date.now() - (window.__APP_MOUNT_TIME__ || Date.now());
    
    if (timeSinceMount < INITIAL_LOAD_DELAY) {
      logger.debug('⏭️ Skipping auto-sync during initial load period');
      return;
    }
    
    // Debounce sync to avoid too many requests (wait 2 seconds after last change)
    const syncTimer = setTimeout(() => {
      logger.debug('🔄 Auto-syncing all data to Supabase...', {
        customers: customers.length,
        products: payterProducts.length,
        bankPF: bankPFRecords.length,
        mccCodes: mccList.length,
        banks: banks.length,
        epkList: epkList.length,
        okList: okList.length,
        salesReps: salesReps.length,
        jobTitles: jobTitles.length,
        partnerships: partnerships.length,
        accountItems: hesapKalemleri.length,
        fixedCommissions: sabitKomisyonlar.length,
        additionalRevenues: ekGelirler.length,
        sharing: sharings.length,
        kartProgram: kartProgramlar.length,
        suspensionReason: suspensionReasons.length
      });
      
      syncAllData({
        customers,
        products: payterProducts,
        bankPF: bankPFRecords,
        mccCodes: mccList,
        banks: banks,
        epkList: epkList,
        okList: okList,
        salesReps: salesReps,
        jobTitles: jobTitles,
        partnerships: partnerships,
        accountItems: hesapKalemleri,
        fixedCommissions: sabitKomisyonlar,
        additionalRevenues: ekGelirler,
        sharing: sharings,
        kartProgram: kartProgramlar,
        suspensionReason: suspensionReasons,
        domainMappings: domainMappings,
        signs: signs,
        earnings: earnings
      });
    }, 2000);

    return () => clearTimeout(syncTimer);
  }, [
    customers, 
    payterProducts, 
    bankPFRecords, 
    mccList,
    banks,
    epkList,
    okList,
    salesReps,
    jobTitles,
    partnerships,
    hesapKalemleri,
    sabitKomisyonlar,
    ekGelirler,
    sharings,
    kartProgramlar,
    suspensionReasons,
    domainMappings,
    signs,
    earnings,
    dataLoaded
  ]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔗 URL ROUTING: Handle deep links from context menu
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!dataLoaded) return; // Wait for data to load first
    
    // Check if URL has routing parameters
    if (route.module) {
      logger.info('🔗 URL routing detected:', route);
      
      // Handle module navigation
      switch (route.module) {
        case 'customer':
          setActiveModule('customers');
          if (route.id) {
            const customer = customers.find(c => c.id === route.id);
            if (customer) {
              logger.info('✅ Customer found:', customer.cariAdi);
            }
          }
          break;
          
        case 'bankpf':
          setActiveModule('bankpf');
          if (route.id) {
            setSelectedBankPFId(route.id);
            logger.info('✅ BankPF selected:', route.id);
          }
          break;
          
        case 'product':
          setActiveModule('products');
          break;
          
        case 'revenue':
          setActiveModule('revenue');
          break;
          
        case 'reports':
          setActiveModule('reports');
          break;
          
        case 'definitions':
          setActiveModule('definitions');
          break;
          
        case 'dsym':
          setActiveModule('dsym');
          break;
          
        case 'dataInspector':
          setActiveModule('dataInspector');
          break;
          
        case 'migration':
          setActiveModule('migration');
          break;
          
        default:
          logger.warn('Unknown module:', route.module);
      }
    }
  }, [route, dataLoaded, customers, bankPFRecords]);

  // ========================================
  // 📥 REAL-TIME SUBSCRIPTIONS: Multi-user sync
  // ========================================
  
  // 📥 REAL-TIME: EPK List değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for EPK List...');
    
    const epkChannel = supabase
      .channel('epk-list-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'epk_list' },
        async (payload) => {
          logger.debug('📥 EPK değişikliği algılandı:', payload);
          try {
            const { data } = await epkListApi.getAll();
            if (data) {
              setEpkList(data);
              logger.debug('✅ EPK listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ EPK listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 EPK real-time subscription kapatılıyor...');
      supabase.removeChannel(epkChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: ÖK List değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for ÖK List...');
    
    const okChannel = supabase
      .channel('ok-list-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ok_list' },
        async (payload) => {
          logger.debug('📥 ÖK değişikliği algılandı:', payload);
          try {
            const { data } = await okListApi.getAll();
            if (data) {
              setOkList(data);
              logger.debug('✅ ÖK listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ ÖK listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 ÖK real-time subscription kapatılıyor...');
      supabase.removeChannel(okChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Banks değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Banks...');
    
    const banksChannel = supabase
      .channel('banks-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'banks' },
        async (payload) => {
          logger.debug('📥 Banka değişikliği algılandı:', payload);
          try {
            const { data } = await banksApi.getAll();
            if (data) {
              setBanks(data);
              logger.debug('✅ Bankalar listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Bankalar listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Banks real-time subscription kapatılıyor...');
      supabase.removeChannel(banksChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: MCC Codes değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for MCC Codes...');
    
    const mccChannel = supabase
      .channel('mcc-codes-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'mcc_codes' },
        async (payload) => {
          logger.debug('📥 MCC değişikliği algılandı:', payload);
          try {
            const { data } = await mccCodesApi.getAll();
            if (data) {
              setMccList(data);
              logger.debug('✅ MCC listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ MCC listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 MCC Codes real-time subscription kapatılıyor...');
      supabase.removeChannel(mccChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Sales Representatives değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Sales Representatives...');
    
    const salesRepsChannel = supabase
      .channel('sales-reps-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sales_representatives' },
        async (payload) => {
          logger.debug('📥 Satış Temsilcisi değişikliği algılandı:', payload);
          try {
            const { data } = await salesRepsApi.getAll();
            if (data) {
              setSalesReps(data);
              logger.debug('✅ Satış Temsilcileri listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Satış Temsilcileri listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Sales Representatives real-time subscription kapatılıyor...');
      supabase.removeChannel(salesRepsChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Job Titles değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Job Titles...');
    
    const jobTitlesChannel = supabase
      .channel('job-titles-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'job_titles' },
        async (payload) => {
          logger.debug('📥 Ünvan değişikliği algılandı:', payload);
          try {
            const { data } = await jobTitlesApi.getAll();
            if (data) {
              setJobTitles(data);
              logger.debug('✅ Ünvanlar listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Ünvanlar listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Job Titles real-time subscription kapatılıyor...');
      supabase.removeChannel(jobTitlesChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Partnerships değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Partnerships...');
    
    const partnershipsChannel = supabase
      .channel('partnerships-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'partnerships' },
        async (payload) => {
          logger.debug('📥 Ortaklık değişikliği algılandı:', payload);
          try {
            const { data } = await partnershipsApi.getAll();
            if (data) {
              setPartnerships(data);
              logger.debug('✅ Ortaklıklar listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Ortaklıklar listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Partnerships real-time subscription kapatılıyor...');
      supabase.removeChannel(partnershipsChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Sharing değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Sharing...');
    
    const sharingChannel = supabase
      .channel('sharing-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sharing' },
        async (payload) => {
          logger.debug('📥 Paylaşım değişikliği algılandı:', payload);
          try {
            const { data } = await sharingApi.getAll();
            if (data) {
              setSharings(data);
              logger.debug('✅ Paylaşımlar listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Paylaşımlar listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Sharing real-time subscription kapatılıyor...');
      supabase.removeChannel(sharingChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Kart Program değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Kart Program...');
    
    const kartProgramChannel = supabase
      .channel('kart-program-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'kart_program' },
        async (payload) => {
          logger.debug('📥 Kart Program değişikliği algılandı:', payload);
          try {
            const { data } = await kartProgramApi.getAll();
            if (data) {
              setKartProgramlar(data);
              logger.debug('✅ Kart Programlar listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Kart Programlar listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Kart Program real-time subscription kapatılıyor...');
      supabase.removeChannel(kartProgramChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Suspension Reasons değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Suspension Reasons...');
    
    const suspensionChannel = supabase
      .channel('suspension-reasons-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'suspension_reasons' },
        async (payload) => {
          logger.debug('📥 Tatil Nedeni değişikliği algılandı:', payload);
          try {
            const { data } = await suspensionReasonApi.getAll();
            if (data) {
              setSuspensionReasons(data);
              logger.debug('✅ Tatil Nedenleri listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Tatil Nedenleri listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Suspension Reasons real-time subscription kapatılıyor...');
      supabase.removeChannel(suspensionChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Domain Mappings değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Domain Mappings...');
    
    const domainChannel = supabase
      .channel('domain-mappings-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'domain_mappings' },
        async (payload) => {
          logger.debug('📥 Domain Mapping değişikliği algılandı:', payload);
          try {
            const { data } = await domainMappingApi.getAll();
            if (data) {
              setDomainMappings(data);
              logger.debug('✅ Domain Mappings listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Domain Mappings listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Domain Mappings real-time subscription kapatılıyor...');
      supabase.removeChannel(domainChannel);
    };
  }, [dataLoaded]);

  // ❌ REMOVED: Signs realtime listener birleştirildi
  // Artık Bank Accounts listener içinde hem signs state hem de BankPF enrichment yapılıyor (satır ~1220-1270)

  // 📥 REAL-TIME: Earnings değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Earnings...');
    
    const earningsChannel = supabase
      .channel('earnings-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'earnings' },
        async (payload) => {
          logger.debug('📥 Hakediş değişikliği algılandı:', payload);
          try {
            // ✅ FIX: BankPF, Earnings VE Signs verilerini birlikte refresh et (tam enrichment)
            const [bankPFResult, earningsResult, signsResult] = await Promise.all([
              bankPFApi.getAll(),
              earningsApi.getAll(),
              signApi.getAll()
            ]);
            
            if (earningsResult.success && earningsResult.data) {
              // ✅ Global earnings state'ini güncelle
              setEarnings(earningsResult.data);
              
              // ✅ BankPF enrichment (Earnings + Signs ile TAM enrichment!)
              if (bankPFResult.success && bankPFResult.data) {
                let enrichedBankPFRecords = bankPFResult.data;
                
                // ✅ EARNINGS enrichment
                const earningsByFirmaId = new Map<string, any[]>();
                earningsResult.data.forEach((earning: any) => {
                  if (earning.firmaId) {
                    const existing = earningsByFirmaId.get(earning.firmaId) || [];
                    earningsByFirmaId.set(earning.firmaId, [...existing, earning]);
                  }
                });
                
                enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
                  ...bankPF,
                  hakedisRecords: earningsByFirmaId.get(bankPF.id) || bankPF.hakedisRecords || []
                }));
                
                logger.debug(`✅ Earnings enrichment: ${earningsResult.data.length} kayıt, ${earningsByFirmaId.size} firmaya eşleşti`);
                
                // ✅ SIGNS enrichment (YENİ!)
                if (signsResult.success && signsResult.data) {
                  const signsByFirmaId = new Map<string, TabelaRecord[]>();
                  signsResult.data.forEach((sign: any) => {
                    if (sign.firmaId) {
                      const existing = signsByFirmaId.get(sign.firmaId) || [];
                      signsByFirmaId.set(sign.firmaId, [...existing, sign as TabelaRecord]);
                    }
                  });
                  
                  enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
                    ...bankPF,
                    tabelaRecords: signsByFirmaId.get(bankPF.id) || bankPF.tabelaRecords || []
                  }));
                  
                  logger.debug(`✅ Signs enrichment: ${signsResult.data.length} kayıt, ${signsByFirmaId.size} firmaya eşleşti`);
                }
                
                setBankPFRecords(enrichedBankPFRecords);
                logger.debug(`✅ Hakediş değişikliği sonrası BankPF listesi güncellendi (tam enrichment):`, enrichedBankPFRecords.length, 'kayıt');
              } else {
                logger.debug('✅ Hakediş listesi güncellendi:', earningsResult.data.length, 'kayıt');
              }
            }
          } catch (error) {
            logger.error('❌ Hakediş listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Earnings real-time subscription kapatılıyor...');
      supabase.removeChannel(earningsChannel);
    };
  }, [dataLoaded]);

  // ❌ DISABLED: Signs <-> BankPFRecords sync artık gereksiz
  // Realtime listener ve initial load zaten enrichment yapıyor
  // ✅ SYNC: Signs -> BankPFRecords tabelaRecords senkronizasyonu (DISABLED) (useRef ile infinite loop önlemi)
  const previousSignsRef = useRef<string>('');
  const previousBankPFRef = useRef<string>('');
  
  useEffect(() => {
    // 🚫 PERMANENTLY DISABLED: Bu sync logic enrichment'ı override edip bozuyor!
    // Initial enrichment (satır 364-393) doğru çalışıyor ama bu useEffect onu bozuyor
    // Console'dan kanıt: "✅ Enriched with 8/15" → sonra "⚠️ TABELA bulunamadı"
    return;
    
    if (!signs || signs.length === 0 || !bankPFRecords || bankPFRecords.length === 0) return;
    
    // 🔍 Önceki değerlerle karşılaştır
    const currentSignsHash = JSON.stringify(signs.map(s => s.id).sort());
    const currentBankPFHash = JSON.stringify(bankPFRecords.map(b => b.id).sort());
    
    // Eğer signs veya bankPFRecords listesi değişmediyse, işlem yapma
    if (previousSignsRef.current === currentSignsHash && previousBankPFRef.current === currentBankPFHash) {
      return;
    }
    
    logger.debug('🔄 Syncing signs to bankPFRecords.tabelaRecords...', {
      signsCount: signs.length,
      bankPFCount: bankPFRecords.length
    });

    // Her firma için signs'dan ilgili tabelaRecords'u filtrele ve ekle
    const updatedBankPFRecords = bankPFRecords.map(firma => {
      const firmaSigns = signs.filter((sign: any) => sign.firmaId === firma.id);
      
      if (firmaSigns.length > 0) {
        logger.debug(`✅ Firma ${firma.firmaUnvan} için ${firmaSigns.length} TABELA kaydı bulundu`);
        return {
          ...firma,
          tabelaRecords: firmaSigns
        };
      } else {
        // 🔍 DEBUG: Eşleşmeyen firma
        const allFirmaIds = signs.map((s: any) => s.firmaId).filter(Boolean);
        if (allFirmaIds.length > 0 && signs.length > 0) {
          logger.debug(`⚠️ Firma ${firma.firmaUnvan} (ID: ${firma.id}) için TABELA bulunamadı. Signs'daki mevcut firmaId'ler: ${[...new Set(allFirmaIds)].slice(0, 5).join(', ')}...`);
        }
      }
      
      return {
        ...firma,
        tabelaRecords: [] // ✅ Boş array ile başlat
      };
    });

    setBankPFRecords(updatedBankPFRecords);
    
    // 🔍 Güncel değerleri kaydet
    previousSignsRef.current = currentSignsHash;
    previousBankPFRef.current = currentBankPFHash;
    
    logger.debug('✅ Signs -> BankPFRecords senkronizasyonu tamamlandı');
  }, [signs, bankPFRecords]);

  // ❌ REMOVED: BankPFRecords -> Signs ters yön senkronizasyonu
  // Bu kod yanlıştı - Signs ana kaynak olmalı, BankPF'lerden değiştirilmemeli
  // Signs Supabase'den gelir, BankPF'ler sadece enrichment için signs'dan veri alır
  
  // 🚫 PERMANENTLY DISABLED: Earnings sync artık gereksiz
  // Initial enrichment (satır ~400) zaten earnings'ı da map ediyor
  // Bu useEffect gereksiz ve infinite loop riski taşıyor
  useEffect(() => {
    // 🚫 DISABLED: Initial enrichment hem Signs hem Earnings'ı zaten yapıyor
    return;
    
    if (!earnings || earnings.length === 0 || !bankPFRecords || bankPFRecords.length === 0) return;
    
    logger.debug('🔄 Syncing earnings to bankPFRecords.hakedisRecords...', {
      earningsCount: earnings.length,
      bankPFCount: bankPFRecords.length
    });

    // Her firma için earnings'dan ilgili hakedisRecords'u filtrele ve ekle
    const updatedBankPFRecords = bankPFRecords.map(firma => {
      const firmaEarnings = earnings.filter((earning: any) => earning.firmaId === firma.id);
      
      if (firmaEarnings.length > 0) {
        logger.debug(`✅ Firma ${firma.firmaUnvan} (ID: ${firma.id}) için ${firmaEarnings.length} HAKEDİŞ kaydı bulundu`);
        return {
          ...firma,
          hakedisRecords: firmaEarnings
        };
      } else {
        // 🔍 DEBUG: Eşleşmeyen firma
        const allFirmaIds = earnings.map((e: any) => e.firmaId).filter(Boolean);
        if (allFirmaIds.length > 0) {
          logger.debug(`⚠️ Firma ${firma.firmaUnvan} (ID: ${firma.id}) için HAKEDİŞ bulunamadı. Mevcut firmaId'ler: ${[...new Set(allFirmaIds)].join(', ')}`);
        }
      }
      
      return firma;
    });

    setBankPFRecords(updatedBankPFRecords);
    logger.debug('✅ Earnings -> BankPFRecords senkronizasyonu tamamlandı');
  }, [earnings]);

  // ❌ DISABLED: BankPFRecords hakedisRecords -> Earnings (ters yön senkronizasyonu)
  // Bu sync artık devre dışı - Tüm hakediş verileri Supabase'den geliyor
  // JSON'dan yükleme yapılmıyor çünkü tam Supabase migration yapıldı
  /*
  useEffect(() => {
    if (!bankPFRecords || bankPFRecords.length === 0) return;
    
    // Tüm firmalardan hakedisRecords'u topla
    const allHakedisRecords: any[] = [];
    bankPFRecords.forEach(firma => {
      if (firma.hakedisRecords && firma.hakedisRecords.length > 0) {
        // Her hakediş kaydına firmaId ekle
        const recordsWithFirmaId = firma.hakedisRecords.map(h => ({
          ...h,
          firmaId: firma.id
        }));
        allHakedisRecords.push(...recordsWithFirmaId);
      }
    });

    if (allHakedisRecords.length > 0) {
      setEarnings(allHakedisRecords);
      logger.debug('✅ BankPFRecords -> Earnings senkronizasyonu tamamlandı', {
        totalRecords: allHakedisRecords.length
      });
    }
  }, [bankPFRecords]);
  */

  // 📥 REAL-TIME: Customers değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Customers...');
    
    const customersChannel = supabase
      .channel('customers-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        async (payload) => {
          logger.debug('📥 Müşteri değişikliği algılandı:', payload);
          try {
            const { data } = await customerApi.getAll();
            if (data) {
              setCustomers(data);
              logger.debug('✅ Müşteriler listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Müşteriler listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Customers real-time subscription kapatılıyor...');
      supabase.removeChannel(customersChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Products değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Products...');
    
    const productsChannel = supabase
      .channel('products-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async (payload) => {
          logger.debug('📥 Ürün değişikliği algılandı:', payload);
          try {
            const { data } = await productApi.getAll();
            if (data) {
              setPayterProducts(data);
              logger.debug('✅ Ürünler listesi güncellendi:', data.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Ürünler listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Products real-time subscription kapatılıyor...');
      supabase.removeChannel(productsChannel);
    };
  }, [dataLoaded]);

  // 📥 REAL-TIME: Bank Accounts (BankPF) ve Signs (TABELA) değişikliklerini dinle
  useEffect(() => {
    if (!dataLoaded || !FeatureFlags.ENABLE_REALTIME_SYNC) return;
    
    logger.debug('🔄 Starting real-time subscription for Bank Accounts...');
    
    const bankAccountsChannel = supabase
      .channel('bank-accounts-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bank_accounts' },
        async (payload) => {
          logger.debug('📥 Banka Hesap değişikliği algılandı:', payload);
          try {
            // ✅ FIX: BankPF, Signs VE Earnings verilerini birlikte refresh et (tam enrichment)
            const [bankPFResult, signsResult, earningsResult] = await Promise.all([
              bankPFApi.getAll(),
              signApi.getAll(),
              earningsApi.getAll()
            ]);
            
            if (bankPFResult.success && bankPFResult.data) {
              let enrichedBankPFRecords = bankPFResult.data;
              
              // ✅ SIGNS enrichment
              if (signsResult.success && signsResult.data) {
                const signsByFirmaId = new Map<string, TabelaRecord[]>();
                
                // Group signs by firmaId
                signsResult.data.forEach((sign: any) => {
                  if (sign.firmaId) {
                    const existing = signsByFirmaId.get(sign.firmaId) || [];
                    signsByFirmaId.set(sign.firmaId, [...existing, sign as TabelaRecord]);
                  }
                });
                
                // Attach tabelaRecords to each BankPF record
                enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
                  ...bankPF,
                  tabelaRecords: signsByFirmaId.get(bankPF.id) || bankPF.tabelaRecords || []
                }));
                
                logger.debug(`✅ Signs enrichment: ${signsResult.data.length} kayıt, ${signsByFirmaId.size} firmaya eşleşti`);
              }
              
              // ✅ EARNINGS enrichment (YENİ!)
              if (earningsResult.success && earningsResult.data) {
                const earningsByFirmaId = new Map<string, any[]>();
                
                // Group earnings by firmaId
                earningsResult.data.forEach((earning: any) => {
                  if (earning.firmaId) {
                    const existing = earningsByFirmaId.get(earning.firmaId) || [];
                    earningsByFirmaId.set(earning.firmaId, [...existing, earning]);
                  }
                });
                
                // Attach hakedisRecords to each BankPF record
                enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
                  ...bankPF,
                  hakedisRecords: earningsByFirmaId.get(bankPF.id) || bankPF.hakedisRecords || []
                }));
                
                logger.debug(`✅ Earnings enrichment: ${earningsResult.data.length} kayıt, ${earningsByFirmaId.size} firmaya eşleşti`);
              }
              
              setBankPFRecords(enrichedBankPFRecords);
              logger.debug('✅ Banka Hesapları listesi güncellendi (tam enrichment):', enrichedBankPFRecords.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ Banka Hesapları listesi güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    // ✅ FIX: Signs (TABELA) tablosu için realtime listener ekle
    logger.debug('🔄 Starting real-time subscription for Signs (TABELA)...');
    
    const signsChannel = supabase
      .channel('signs-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'signs' },
        async (payload) => {
          logger.debug('📥 TABELA (Signs) değişikliği algılandı:', payload);
          try {
            // ✅ FIX: BankPF, Signs VE Earnings verilerini birlikte refresh et (tam enrichment)
            const [bankPFResult, signsResult, earningsResult] = await Promise.all([
              bankPFApi.getAll(),
              signApi.getAll(),
              earningsApi.getAll()
            ]);
            
            if (bankPFResult.success && bankPFResult.data) {
              let enrichedBankPFRecords = bankPFResult.data;
              
              // ✅ Signs verilerini BankPF kayıtlarına ekle (enrichment)
              if (signsResult.success && signsResult.data) {
                // ✅ Global signs state'ini güncelle
                setSigns(signsResult.data);
                
                const signsByFirmaId = new Map<string, TabelaRecord[]>();
                
                // Group signs by firmaId
                signsResult.data.forEach((sign: any) => {
                  if (sign.firmaId) {
                    const existing = signsByFirmaId.get(sign.firmaId) || [];
                    signsByFirmaId.set(sign.firmaId, [...existing, sign as TabelaRecord]);
                  }
                });
                
                // Attach tabelaRecords to each BankPF record
                enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
                  ...bankPF,
                  tabelaRecords: signsByFirmaId.get(bankPF.id) || bankPF.tabelaRecords || []
                }));
                
                logger.debug(`✅ TABELA enrichment: ${signsResult.data.length} kayıt, ${signsByFirmaId.size} firmaya eşleşti`);
              }
              
              // ✅ EARNINGS enrichment (YENİ!)
              if (earningsResult.success && earningsResult.data) {
                const earningsByFirmaId = new Map<string, any[]>();
                
                // Group earnings by firmaId
                earningsResult.data.forEach((earning: any) => {
                  if (earning.firmaId) {
                    const existing = earningsByFirmaId.get(earning.firmaId) || [];
                    earningsByFirmaId.set(earning.firmaId, [...earning, earning]);
                  }
                });
                
                // Attach hakedisRecords to each BankPF record
                enrichedBankPFRecords = enrichedBankPFRecords.map(bankPF => ({
                  ...bankPF,
                  hakedisRecords: earningsByFirmaId.get(bankPF.id) || bankPF.hakedisRecords || []
                }));
                
                logger.debug(`✅ Earnings enrichment: ${earningsResult.data.length} kayıt, ${earningsByFirmaId.size} firmaya eşleşti`);
              }
              
              setBankPFRecords(enrichedBankPFRecords);
              logger.debug('✅ TABELA değişikliği sonrası BankPF listesi güncellendi (tam enrichment):', enrichedBankPFRecords.length, 'kayıt');
            }
          } catch (error) {
            logger.error('❌ TABELA değişikliği sonrası BankPF güncellenirken hata:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      logger.debug('🛑 Bank Accounts real-time subscription kapatılıyor...');
      supabase.removeChannel(bankAccountsChannel);
      logger.debug('🛑 Signs real-time subscription kapatılıyor...');
      supabase.removeChannel(signsChannel);
    };
  }, [dataLoaded]);

  // Debug: Veri durumu izleme (Ana Sayfa analizi için)
  useEffect(() => {
    const assignedCount = customers.filter(c => c.linkedBankPFIds && c.linkedBankPFIds.length > 0).length;
    const unassignedCount = customers.filter(c => !c.linkedBankPFIds || c.linkedBankPFIds.length === 0).length;
    
    logger.debug('Veri Durumu Özeti', {
      totalCustomers: customers.length,
      totalBankPF: bankPFRecords.length,
      assignedCustomers: assignedCount,
      unassignedCustomers: unassignedCount,
      assignmentRate: customers.length > 0 ? `${Math.round((assignedCount / customers.length) * 100)}%` : '0%'
    });
    
    // Detaylı müşteri-BankPF eşleştirme analizi
    if (assignedCount > 0) {
      const customerBankPFMap = customers
        .filter(c => c.linkedBankPFIds && c.linkedBankPFIds.length > 0)
        .map(c => ({
          customer: c.cariAdi,
          bankPFIds: c.linkedBankPFIds,
          bankPFNames: c.linkedBankPFIds?.map(id => {
            const bankPF = bankPFRecords.find(b => b.id === id);
            return bankPF?.firmaUnvan || `[ID: ${id}]`;
          }).join(', ') || 'Yok'
        }));
      logger.table(customerBankPFMap, 'Müşteri-BankPF Eşleştirmeleri');
    }
  }, [customers, bankPFRecords]);

  // ============================================================================
  // PERFORMANCE OPTIMIZATION - MEMOIZED FILTERED LISTS
  // ============================================================================
  // Aktif kayıtları önceden filtrele (her render'da yeniden filtreleme yerine)
  const activeBanks = useMemo(() => banks.filter(b => b.aktif), [banks]);
  const activeEPKs = useMemo(() => epkList.filter(e => e.aktif), [epkList]);
  const activeOKs = useMemo(() => okList.filter(o => o.aktif), [okList]);
  const activeSalesReps = useMemo(() => salesReps.filter(r => r.aktif), [salesReps]);
  const activeJobTitles = useMemo(() => jobTitles.filter(t => t.aktif), [jobTitles]);
  const activeKartProgramlar = useMemo(() => kartProgramlar.filter(k => k.aktif), [kartProgramlar]);

  // CustomerModule için özel transformasyonlar
  // ⚠️ FIX: Tüm MCC'leri göster (aktif/pasif fark etmeksizin)
  // Müşteri kartında MCC seçimi için tüm kayıtlar gerekli
  const activeMCCListForCustomer = useMemo(() => {
    return mccList.map(m => ({ kod: m.kod, kategori: m.kategori }));
  }, [mccList]);

  // BankPFModule için özel transformasyonlar
  const gorevListesiForBankPF = useMemo(
    () => activeJobTitles.map(t => t.unvan),
    [activeJobTitles]
  );

  const gelirModelleriForBankPF = useMemo(
    () => sharings.map(s => ({ id: s.id, ad: s.modelAdi, aktif: s.aktif })),
    [sharings]
  );

  const hesapKalemleriForBankPF = useMemo(
    () => hesapKalemleri.map(h => ({ 
      id: h.id, 
      kod: h.kod, 
      adi: h.adi,
      aciklama: h.aciklama,
      aktif: h.aktif
    })),
    [hesapKalemleri]
  );

  // ============================================================================
  // PERFORMANCE OPTIMIZATION - MEMOIZED CALLBACKS
  // ============================================================================
  // BankPF navigasyon callback'i (CustomerModule'den çağrılır)
  const handleBankPFNavigate = useCallback((id: string) => {
    setSelectedBankPFId(id);
    setActiveModule('bankpf');
  }, []);

  // BankPF ID temizleme callback'i
  const handleClearSelectedBankPFId = useCallback(() => {
    setSelectedBankPFId(null);
  }, []);

  // BankPF silme callback'i (müşteri referanslarını temizler)
  const handleDeleteBankPF = useCallback((deletedId: string) => {
    logger.debug('Müşteri referansları temizleniyor', { deletedBankPFId: deletedId });
    
    const updatedCustomers = customers.map(customer => {
      if (customer.linkedBankPFIds && customer.linkedBankPFIds.includes(deletedId)) {
        const updatedLinkedIds = customer.linkedBankPFIds.filter(id => id !== deletedId);
        logger.debug('linkedBankPFIds güncellendi', { customerName: customer.cariAdi });
        return {
          ...customer,
          linkedBankPFIds: updatedLinkedIds.length > 0 ? updatedLinkedIds : undefined
        };
      }
      return customer;
    });
    
    setCustomers(updatedCustomers);
    
    const affectedCount = updatedCustomers.filter(c => 
      customers.find(original => original.id === c.id && 
        original.linkedBankPFIds?.length !== c.linkedBankPFIds?.length)
    ).length;
    
    if (affectedCount > 0) {
      logger.info('Müşteri referansları temizlendi', { affectedCount });
    }
  }, [customers]);

  // Müşteri güncelleme callback'i (RevenueModule'den çağrılır)
  const handleUpdateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prevCustomers => {
      const oldCustomer = prevCustomers.find(c => c.id === updatedCustomer.id);
      
      // Log activity
      if (oldCustomer) {
        logActivity('UPDATE', 'Müşteri', updatedCustomer.cariAdi, {
          entityId: updatedCustomer.id,
          details: `Müşteri bilgileri güncellendi`,
          metadata: {
            hesapKodu: updatedCustomer.cariHesapKodu,
            durum: updatedCustomer.durum,
          },
        });
      }
      
      return prevCustomers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    });
  }, []);

  // 🧹 Supabase SQL-Based Duplicate Cleanup Handler
  const handleDeduplication = useCallback(async () => {
    const loadingToast = toast.loading('🧹 Duplicate kayıtlar Supabase\'de temizleniyor...');
    
    try {
      // Call Supabase SQL function
      const result = await cleanupAllDuplicatesSQL();
      
      toast.dismiss(loadingToast);
      
      if (result.success && result.results) {
        // Count total deleted records
        const totalDeleted = result.results.reduce((sum, r) => sum + (r.deleted_count || 0), 0);
        const successfulTables = result.results.filter(r => r.status === 'success').length;
        const totalTables = result.results.length;
        
        if (totalDeleted > 0) {
          // Show detailed results
          logger.debug('📊 Cleanup Results:', result.results);
          
          toast.success(
            `✅ ${totalDeleted} duplicate kayıt silindi!`,
            {
              description: `${successfulTables}/${totalTables} tablo temizlendi`,
              duration: 5000,
            }
          );
          
          // Verileri yeniden yükle
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.success('✨ Veritabanı zaten temiz! Duplicate kayıt bulunamadı.');
        }
      } else {
        toast.error(
          `❌ Temizleme başarısız`,
          {
            description: result.error || 'Bilinmeyen hata',
          }
        );
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      logger.error('❌ Deduplication error:', error);
      toast.error('Temizleme sırasında hata oluştu', {
        description: error.message || 'Bilinmeyen hata',
      });
    }
  }, []);

  // ⚡ SSR-SAFE JSON IMPORT HANDLER (Batched setState ile hydration fix)
  /**
   * JSON dosyasını import eder - SSR-safe ve batched setState kullanır
   * FileReader render dışında tanımlı, tüm setState'ler batched
   */
  const handleJSONImport = useCallback(() => {
    if (typeof window === 'undefined') return; // SSR guard
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target?.result as string);
          
          // ✅ 1. VALIDATION - Veri yapısını kontrol et
          const validation = validateImportData(importData);
          if (!validation.valid) {
            toast.error(validation.errors[0]);
            logger.error('JSON import validation failed:', validation.errors);
            return;
          }
          
          // ✅ 2. VERSION CHECK & MIGRATION
          let processedData = importData;
          const importVersion = importData.version || '1.0';
          
          if (importVersion !== CURRENT_APP_VERSION) {
            processedData = migrateData(importData, importVersion);
            logger.info(`Migration applied: v${importVersion} → v${CURRENT_APP_VERSION}`);
          }
          
          // ✅ 3. BATCHED DATA IMPORT - Tüm setState'leri batch içinde çalıştır
          const data = processedData.data;
          let importedCount = 0;
          
          // ⚡ CRITICAL: Batched updates (hydration fix)
          unstable_batchedUpdates(() => {
            if (data.customers) { setCustomers(data.customers); importedCount++; }
            if (data.payterProducts) { setPayterProducts(data.payterProducts); importedCount++; }
            if (data.bankPFRecords) { setBankPFRecords(data.bankPFRecords); importedCount++; }
            if (data.hesapKalemleri) { setHesapKalemleri(data.hesapKalemleri); importedCount++; }
            if (data.sabitKomisyonlar) { setSabitKomisyonlar(data.sabitKomisyonlar); importedCount++; }
            if (data.ekGelirler) { setEkGelirler(data.ekGelirler); importedCount++; }
            if (data.jobTitles) { setJobTitles(data.jobTitles); importedCount++; }
            if (data.mccList) { setMCCList(data.mccList); importedCount++; }
            if (data.banks) { setBanks(data.banks); importedCount++; }
            if (data.epkList) { setEPKList(data.epkList); importedCount++; }
            if (data.okList) { setOKList(data.okList); importedCount++; }
            if (data.partnerships) { setPartnerships(data.partnerships); importedCount++; }
            if (data.sharings) { setSharings(data.sharings); importedCount++; }
            if (data.kartProgramlar) { setKartProgramlar(data.kartProgramlar); importedCount++; }
            if (data.salesReps) { setSalesReps(data.salesReps); importedCount++; }
          });
          
          logger.info(`JSON import completed: ${importedCount} categories imported`);
          
          toast.success(
            importVersion !== CURRENT_APP_VERSION
              ? `✅ Import başarılı! (v${importVersion} → v${CURRENT_APP_VERSION} migration uygulandı)`
              : `✅ Import başarılı! (v${importVersion})`
          );
        } catch (error) {
          logger.error('❌ JSON import hatası:', error);
          toast.error(`JSON dosyası okunamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }, [
    setCustomers, setPayterProducts, setBankPFRecords,
    setHesapKalemleri, setSabitKomisyonlar, setEkGelirler,
    setJobTitles, setMCCList, setBanks, setEPKList, setOKList,
    setPartnerships, setSharings, setKartProgramlar, setSalesReps
  ]);

  // ⚡ GLOBAL SEARCH - Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ⚡ GLOBAL SEARCH - Initialize search index
  const globalSearch = useGlobalSearch({
    customers,
    bankPFRecords,
    payterProducts,
    salesReps,
  });

  // ⚡ GLOBAL SEARCH - Navigate to module from search result
  const handleSearchNavigate = useCallback((moduleLink: string, itemId?: string) => {
    setActiveModule(moduleLink as any);
    
    // If navigating to BankPF with specific item, set selected ID
    if (moduleLink === 'bankpf' && itemId && !itemId.startsWith('tabela-') && !itemId.startsWith('hakedis-')) {
      setSelectedBankPFId(itemId);
    }
    
    // Show toast
    toast.success('Kayda yönlendirildiniz');
  }, []);

  // Müşteri İstatistikleri - Ana Sayfa için
  // Sektör bazlı istatistikler
  const sektorStats = useMemo(() => {
    const sektorMap = new Map<string, number>();
    
    // ✅ ARRAY SAFETY: Ensure customers is a valid array
    const safeCustomers = Array.isArray(customers) ? customers : [];
    safeCustomers.forEach(customer => {
      const sektor = customer.sektor?.trim() || 'Belirtilmemiş';
      sektorMap.set(sektor, (sektorMap.get(sektor) || 0) + 1);
    });

    return Array.from(sektorMap.entries())
      .map(([sektor, count]) => ({ sektor, count }))
      .sort((a, b) => b.count - a.count);
  }, [customers]);

  // Durum bazlı istatistikler
  const durumStats = useMemo(() => {
    // ✅ ARRAY SAFETY: Ensure customers is a valid array
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const aktifCount = safeCustomers.filter(c => c.durum === 'Aktif').length;
    const pasifCount = safeCustomers.filter(c => c.durum === 'Pasif').length;
    
    return [
      { durum: 'Aktif', count: aktifCount },
      { durum: 'Pasif', count: pasifCount },
    ];
  }, [customers]);



  // Satış temsilcisi istatistikleri
  const salesRepStats = useMemo(() => {
    const stats = new Map<string, { repName: string; count: number; customers: Customer[] }>();
    
    // Her satış temsilcisi için başlangıç değerleri
    // ✅ ARRAY SAFETY: Ensure salesReps is a valid array
    const safeSalesReps = Array.isArray(salesReps) ? salesReps : [];
    safeSalesReps.forEach(rep => {
      stats.set(rep.id, { repName: rep.adSoyad, count: 0, customers: [] });
    });
    
    // Atanmamış müşteriler için
    stats.set('unassigned', { repName: 'Atanmamış', count: 0, customers: [] });
    
    // Müşterileri temsilcilere göre grupla
    // ✅ ARRAY SAFETY: Ensure customers is a valid array
    const safeCustomers2 = Array.isArray(customers) ? customers : [];
    safeCustomers2.forEach(customer => {
      if (customer.salesRepId && stats.has(customer.salesRepId)) {
        const stat = stats.get(customer.salesRepId)!;
        stat.count++;
        stat.customers.push(customer);
      } else {
        const stat = stats.get('unassigned')!;
        stat.count++;
        stat.customers.push(customer);
      }
    });
    
    return Array.from(stats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .filter(stat => stat.count > 0 || stat.id !== 'unassigned') // Atanmamış 0 ise gösterme
      .sort((a, b) => b.count - a.count);
  }, [customers, salesReps]);

  // PayterProduct'lardan gerçek cihaz sayılarını hesapla
  const { totalP6X, totalApollo, deviceCountByCustomer } = useMemo(() => {
    let p6xCount = 0;
    let apolloCount = 0;
    const customerDevices = new Map<string, { p6x: number; apollo: number; total: number }>();
    
    // Tüm ürünleri say ve müşterilere göre grupla
    // ✅ ARRAY SAFETY: Ensure payterProducts is a valid array
    const safePayterProducts = Array.isArray(payterProducts) ? payterProducts : [];
    safePayterProducts.forEach(product => {
      const model = product.terminalModel?.toUpperCase() || '';
      const isP6X = model.includes('P6X') || model.includes('P6-X') || model.includes('P 6 X');
      const isApollo = model.includes('APOLLO');
      
      if (isP6X) p6xCount++;
      else if (isApollo) apolloCount++;
      
      // Domain bazlı müşteri eşleştirmesi
      const productDomain = product.domain?.toLowerCase().trim() || '';
      if (productDomain) {
        // ✅ ARRAY SAFETY: Ensure customers is a valid array
        const safeCustomers3 = Array.isArray(customers) ? customers : [];
        safeCustomers3.forEach(customer => {
          const customerDomains = customer.domainHiyerarsisi?.map(d => d.domain.toLowerCase().trim()) || [];
          if (customerDomains.some(cd => productDomain.includes(cd) || cd.includes(productDomain))) {
            if (!customerDevices.has(customer.id)) {
              customerDevices.set(customer.id, { p6x: 0, apollo: 0, total: 0 });
            }
            const deviceData = customerDevices.get(customer.id)!;
            if (isP6X) deviceData.p6x++;
            else if (isApollo) deviceData.apollo++;
            deviceData.total++;
          }
        });
      }
    });
    
    return { 
      totalP6X: p6xCount, 
      totalApollo: apolloCount,
      deviceCountByCustomer: customerDevices
    };
  }, [payterProducts, customers]);

  // Toplam cihaz sayısı
  const totalDevices = totalP6X + totalApollo;

  // Müşteri büyüklüğü segmentleri (PayterProduct'lardan gerçek cihaz sayıları)
  const musteriSegmentleri = useMemo(() => {
    const segmentler = [
      { label: '1-10', min: 1, max: 10, count: 0, musteriler: [] as Customer[] },
      { label: '11-25', min: 11, max: 25, count: 0, musteriler: [] as Customer[] },
      { label: '26-100', min: 26, max: 100, count: 0, musteriler: [] as Customer[] },
      { label: '101-500', min: 101, max: 500, count: 0, musteriler: [] as Customer[] },
      { label: '501-10000', min: 501, max: 10000, count: 0, musteriler: [] as Customer[] },
    ];
    
    // ✅ ARRAY SAFETY: Ensure customers is a valid array
    const safeCustomers4 = Array.isArray(customers) ? customers : [];
    safeCustomers4.forEach(customer => {
      const deviceData = deviceCountByCustomer.get(customer.id);
      const toplamCihaz = deviceData?.total || 0;
      
      for (const segment of segmentler) {
        if (toplamCihaz >= segment.min && toplamCihaz <= segment.max) {
          segment.count++;
          segment.musteriler.push(customer);
          break;
        }
      }
    });
    
    return segmentler;
  }, [customers, deviceCountByCustomer]);

  // Ana Sayfa için tüm hesaplamaları memoize et (infinite loop'u önlemek için)
  // PERFORMANCE: Sadece activeModule='home' iken hesapla (800+ satır optimizasyonu)
  const homePageData = useMemo(() => {
    // Eğer ana sayfa aktif değilse, hesaplama yapma
    if (activeModule !== 'home') {
      return null;
    }
    // Cihaz dağılımı
    const deviceDistribution = customers
      .filter(c => {
        const deviceData = deviceCountByCustomer.get(c.id);
        return deviceData && deviceData.total > 0;
      })
      .map(c => {
        const deviceData = deviceCountByCustomer.get(c.id)!;
        return {
          id: c.id,
          name: c.cariAdi,
          subtitle: `${deviceData.total} cihaz (P6X: ${deviceData.p6x}, APOLLO: ${deviceData.apollo})`
        };
      })
      .sort((a, b) => {
        const aTotal = extractLeadingNumber(a.subtitle);
        const bTotal = extractLeadingNumber(b.subtitle);
        return bTotal - aTotal;
      });

    // Atanmamış müşteriler
    const unassignedBankPFCustomers = customers.filter(c => 
      !c.linkedBankPFIds || c.linkedBankPFIds.length === 0
    );

    // Tüm müşteriler listesi
    const allCustomersList = customers.map(c => ({
      id: c.id,
      name: c.cariAdi,
      subtitle: `${c.sektor || 'Belirtilmemiş'} - ${c.durum || 'Belirtilmemiş'}`,
      value: c.durum
    }));

    // Hizmet bedeli müşteri listeleri
    interface FeeListItem {
      id: string;
      name: string;
      subtitle: string;
      value: string;
    }
    const monthlyFeeList: FeeListItem[] = [];
    const yearlyFeeList: FeeListItem[] = [];
    const noFeeList: FeeListItem[] = [];

    // ✅ ARRAY SAFETY: Ensure customers is a valid array
    const safeCustomers5 = Array.isArray(customers) ? customers : [];
    safeCustomers5.forEach(customer => {
      const deviceData = deviceCountByCustomer.get(customer.id);
      const customerDeviceCount = deviceData?.total || 0;
      
      if (customerDeviceCount > 0) {
        if (customer.serviceFeeSettings && customer.serviceFeeSettings.isActive) {
          const fee = customer.serviceFeeSettings?.customFeePerDevice || customer.serviceFeeSettings?.standardFeePerDevice || 10;
          const item = {
            id: customer.id,
            name: customer.cariAdi,
            subtitle: `${customerDeviceCount} cihaz`,
            value: `${fee}€/cihaz/ay`
          };
          
          if (customer.serviceFeeSettings.paymentType === 'monthly') {
            monthlyFeeList.push(item);
          } else if (customer.serviceFeeSettings.paymentType === 'yearly') {
            yearlyFeeList.push(item);
          }
        } else {
          noFeeList.push({
            id: customer.id,
            name: customer.cariAdi,
            subtitle: `${customerDeviceCount} cihaz`,
            value: 'Hizmet bedeli yok'
          });
        }
      }
    });

    // Hesap kalemleri listesi
    const hesapKalemleriList = hesapKalemleri.map(h => ({
      id: h.id,
      name: h.ad,
      subtitle: h.aciklama || 'Açıklama belirtilmemiş',
      value: h.kodNo ? `Kod: ${h.kodONo}` : undefined
    }));

    // Sabit komisyon listesi
    const sabitKomisyonList = sabitKomisyonlar.map(s => {
      const oran = typeof s.oran === 'number' ? s.oran : parseFloat(String(s.oran || 0).replace(',', '.'));
      return {
        id: s.id,
        name: s.ad,
        subtitle: s.aciklama || 'Açıklama belirtilmemiş',
        value: `${oran.toFixed(2)} ₺`
      };
    });

    // Ek gelir listesi
    const ekGelirList = ekGelirler.map(e => {
      const tutar = typeof e.tutar === 'number' ? e.tutar : parseFloat(String(e.tutar || 0).replace(',', '.'));
      return {
        id: e.id,
        name: e.ad,
        subtitle: e.aciklama || 'Açıklama belirtilmemiş',
        value: `${tutar.toFixed(2)} ₺`
      };
    });

    // Gelir modelleri listesi
    const sharingsList = sharings.map(s => ({
      id: s.id,
      name: s.ad,
      subtitle: s.aciklama || 'Açıklama belirtilmemiş',
      value: s.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    // Payter ürünleri listesi
    const payterProductsList = payterProducts.map(p => ({
      id: p.id,
      name: p.name || p.serialNumber || 'İsimsiz Ürün',
      subtitle: `${p.domain || 'Domain belirtilmemiş'} • TID: ${p.tid || '-'}`,
      value: p.terminalModel || p.terminalType || undefined
    }));

    // Banka/PF listesi
    const bankPFList = bankPFRecords.map(b => ({
      id: b.id,
      name: b.firmaUnvan,
      subtitle: `${b.selectedBanka || 'Banka belirtilmemiş'} - ${b.tabelaRecords?.length || 0} TABELA`
    }));

    // Sektör listesi
    const sektorList = sektorStats.map(s => ({
      id: s.sektor,
      name: s.sektor,
      subtitle: `${s.count} müşteri (${customers.length > 0 ? ((s.count / customers.length) * 100).toFixed(1) : 0}%)`
    }));

    // Atanmış ÜİY listesi
    const assignedCustomersList = customers
      .filter(c => c.linkedBankPFIds && c.linkedBankPFIds.length > 0)
      .map(c => {
        const bankPFNames = c.linkedBankPFIds?.map(id => {
          const bankPF = bankPFRecords.find(b => b.id === id);
          return bankPF?.firmaUnvan || id;
        }).join(', ') || '';
        return {
          id: c.id,
          name: c.cariAdi,
          subtitle: bankPFNames,
          value: c.durum
        };
      });

    // MCC listesi
    const mccDetailList = mccList.map(m => ({
      id: m.kod,
      name: `${m.kod} - ${m.kategori}`,
      subtitle: m.aciklama || 'Açıklama belirtilmemiş',
      value: m.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    // Bankalar listesi
    const banksDetailList = banks.map(b => ({
      id: b.id,
      name: `${b.kod} - ${b.bankaAdi}`,
      subtitle: b.aciklama || 'Açıklama belirtilmemiş',
      value: b.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    // EPK listesi
    const epkDetailList = epkList.map(e => ({
      id: e.id,
      name: `${e.kod} - ${e.kurumAdi}`,
      subtitle: e.aciklama || 'Açıklama belirtilmemiş',
      value: e.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    // ÖK listesi
    const okDetailList = okList.map(o => ({
      id: o.id,
      name: `${o.kod} - ${o.kurumAdi}`,
      subtitle: o.aciklama || 'Açıklama belirtilmemiş',
      value: o.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    // Ortaklıklar listesi  
    const partnershipsDetailList = partnerships.map(p => ({
      id: p.id,
      name: p.ad,
      subtitle: p.aciklama || 'Açıklama belirtilmemiş',
      value: p.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    // Kart programları listesi
    const kartProgramDetailList = kartProgramlar.map(k => ({
      id: k.id,
      name: k.ad,
      subtitle: k.aciklama || 'Açıklama belirtilmemiş',
      value: k.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    // Satış temsilcileri listesi
    const salesRepsDetailList = salesReps.map(s => ({
      id: s.id,
      name: s.adSoyad,
      subtitle: s.aktif ? 'Aktif temsilci' : 'Pasif temsilci',
      value: s.aktif ? '✓ Aktif' : '○ Pasif'
    }));

    return {
      deviceDistribution,
      unassignedBankPFCustomers: unassignedBankPFCustomers.map(c => ({
        id: c.id,
        name: c.cariAdi,
        subtitle: `${c.cariHesapKodu} - ${c.durum}`,
        value: c.mcc ? `MCC: ${c.mcc}` : undefined
      })),
      allCustomersList,
      hesapKalemleriList,
      sabitKomisyonList,
      ekGelirList,
      sharingsList,
      payterProductsList,
      bankPFList,
      sektorList,
      monthlyFeeList,
      yearlyFeeList,
      noFeeList,
      assignedCustomersList,
      mccDetailList,
      banksDetailList,
      epkDetailList,
      okDetailList,
      partnershipsDetailList,
      kartProgramDetailList,
      salesRepsDetailList
    };
  }, [activeModule, customers, deviceCountByCustomer, hesapKalemleri, sabitKomisyonlar, ekGelirler, sharings, payterProducts, bankPFRecords, sektorStats, mccList, banks, epkList, okList, partnerships, kartProgramlar, salesReps]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Single Row */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 md:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16 gap-2 md:gap-4">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Mobile Menu Button - Visible only on mobile/tablet (< 1024px) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden flex items-center justify-center p-2 h-10 w-10 min-h-[44px] min-w-[44px] border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                aria-label="Menüyü Aç"
              >
                <Menu size={22} className="text-blue-600" />
              </Button>

              {/* Mobile Menu Sheet */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] p-4 overflow-y-auto">
                  <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2 text-base">
                      <span className="font-bold text-blue-600">Oxivo</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        v{CURRENT_APP_VERSION}
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-3 mt-4">
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('home');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'home'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Home size={18} className="flex-shrink-0" />
                      <span className="truncate">Ana Sayfa</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('reports');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'reports'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FileText size={18} className="flex-shrink-0" />
                      <span className="truncate">Rapor</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('customers');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'customers'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Users size={18} className="flex-shrink-0" />
                      <span className="truncate">Müşteriler</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('bankpf');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'bankpf'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Building2 size={18} className="flex-shrink-0" />
                      <span className="truncate">Banka/PF</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('products');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'products'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Package size={18} className="flex-shrink-0" />
                      <span className="truncate">Ürün</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('revenue');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'revenue'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Euro size={18} className="flex-shrink-0" />
                      <span className="truncate">Gelir</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('definitions');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'definitions'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings size={18} className="flex-shrink-0" />
                      <span className="truncate">Tanımlar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('dsym');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'dsym'
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FileSignature size={18} className="flex-shrink-0" />
                      <span className="truncate">DSYM</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      style={{ minHeight: '48px' }}
                      onClick={() => {
                        setActiveModule('dataInspector');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`justify-start gap-3 ${
                        activeModule === 'dataInspector'
                          ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Supabase Data Inspector"
                    >
                      <Database size={18} className="flex-shrink-0" />
                      <span className="truncate">Data Inspector</span>
                    </Button>
                    {ENV_CONFIG.enableMigrationTools && (
                      <Button
                        variant="ghost"
                        size="default"
                        style={{ minHeight: '48px' }}
                        onClick={() => {
                          setActiveModule('migration');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`justify-start gap-3 ${
                          activeModule === 'migration'
                            ? 'bg-green-600 text-white shadow-md hover:bg-green-700 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Supabase Full Data Migration - localStorage → Supabase"
                      >
                        <Upload size={18} className="flex-shrink-0" />
                        <span className="truncate">Supabase Migration</span>
                      </Button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="font-bold text-blue-600 text-sm sm:text-base text-[32px]">Oxivo</h1>
              </div>
            </div>
            
            {/* Desktop Navigation - Hidden on Mobile */}
            <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('home')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'home'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Home size={13} />
                <span className="text-[13px]">Ana</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('reports')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'reports'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FileText size={13} />
                <span className="text-[14px]">Rapor</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('customers')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'customers'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Users size={13} />
                <span className="text-[13px]">Müşteri</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('bankpf')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'bankpf'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Building2 size={13} />
                <span className="text-[14px]">Banka/PF</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('products')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'products'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Package size={13} />
                <span className="text-[13px]">Ürün</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('revenue')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'revenue'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Euro size={13} />
                <span className="text-[13px]">Gelir</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('definitions')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'definitions'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Settings size={13} />
                <span className="text-[13px]">Tanım</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('dsym')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'dsym'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FileSignature size={13} />
                <span>DSYM</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('dataInspector')}
                className={`gap-1 h-7 px-2 text-[10px] ${
                  activeModule === 'dataInspector'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200 hover:bg-purple-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title="Supabase Data Inspector"
              >
                <Database size={13} />
                <span className="text-[13px]">Inspector</span>
              </Button>
              
              {ENV_CONFIG.enableMigrationTools && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveModule('migration')}
                  className={`gap-1 h-7 px-2 text-[10px] ${
                    activeModule === 'migration'
                      ? 'bg-green-600 text-white shadow-md shadow-green-200 hover:bg-green-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title="Supabase Full Data Migration - localStorage → Supabase"
                >
                  <Upload size={13} />
                  <span>Migrate</span>
                </Button>
              )}
            </nav>
            
            {/* User Info & Logout */}
            <div className="flex items-center gap-1.5 ml-auto border-l border-gray-200 pl-2.5">
              {/* User Email - Hidden on mobile */}
              <span className="hidden md:inline text-[10px] text-gray-600 truncate max-w-[120px]">
                {user?.email}
              </span>
              
              {/* Logout Button */}
              <div className="flex flex-col items-center gap-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logger.debug('🔴 Çıkış butonuna tıklandı - DIRECT LOGOUT');
                    
                    // DIRECT LOGOUT - Bypass authBypass.tsx
                    sessionStorage.setItem('auth_logged_out', 'true');
                    logger.debug('🔴 Set sessionStorage.auth_logged_out = true');
                    
                    toast.success('Başarıyla çıkış yapıldı');
                    
                    // FORCE RELOAD
                    logger.debug('🔴 Reloading page...');
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  }}
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  aria-label="Çıkış"
                >
                  <LogOut size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        {dataLoaded && activeModule === 'home' && (() => {
          // MÜŞTERİ ANALİZİ
          const sektorStats = customers.reduce((acc, customer) => {
            const sektor = customer.sektor || 'Belirtilmemiş';
            const existing = acc.find(s => s.sektor === sektor);
            if (existing) {
              existing.count++;
              existing.customers.push(customer);
            } else {
              acc.push({ sektor, count: 1, customers: [customer] });
            }
            return acc;
          }, [] as { sektor: string; count: number; customers: Customer[] }[]).sort((a, b) => b.count - a.count);

          const durumStats = [
            { 
              durum: 'Aktif', 
              count: customers.filter(c => c.durum === 'Aktif').length,
              customers: customers.filter(c => c.durum === 'Aktif')
            },
            { 
              durum: 'Pasif', 
              count: customers.filter(c => c.durum === 'Pasif').length,
              customers: customers.filter(c => c.durum === 'Pasif')
            }
          ];

          const segmentStats = customers.reduce((acc, customer) => {
            const segment = customer.segment || 'Belirtilmemiş';
            const existing = acc.find(s => s.segment === segment);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ segment, count: 1 });
            }
            return acc;
          }, [] as { segment: string; count: number }[]).sort((a, b) => b.count - a.count);

          // Cihaz bazlı müşteri segmentleri (global deviceCountByCustomer kullanılıyor)
          const deviceSegments = [
            { label: 'Cihaz Yok (0)', min: 0, max: 0, count: 0, totalDevices: 0, customers: [] as Customer[], color: '#94a3b8' },
            { label: 'Küçük (1-10)', min: 1, max: 10, count: 0, totalDevices: 0, customers: [] as Customer[], color: '#60a5fa' },
            { label: 'Orta (11-25)', min: 11, max: 25, count: 0, totalDevices: 0, customers: [] as Customer[], color: '#34d399' },
            { label: 'Büyük (26-100)', min: 26, max: 100, count: 0, totalDevices: 0, customers: [] as Customer[], color: '#fbbf24' },
            { label: 'Kurumsal (101-500)', min: 101, max: 500, count: 0, totalDevices: 0, customers: [] as Customer[], color: '#f97316' },
            { label: 'Enterprise (501+)', min: 501, max: 100000, count: 0, totalDevices: 0, customers: [] as Customer[], color: '#dc2626' },
          ];
          
          // Müşteri segmentlerini hesapla (global deviceCountByCustomer kullanılıyor)
          // ✅ ARRAY SAFETY: Ensure customers is a valid array
          const safeCustomers6 = Array.isArray(customers) ? customers : [];
          safeCustomers6.forEach(customer => {
            const deviceData = deviceCountByCustomer.get(customer.id);
            const deviceCount = deviceData?.total || 0;
            
            // Segmente ekle
            for (const segment of deviceSegments) {
              if (deviceCount >= segment.min && deviceCount <= segment.max) {
                segment.count++;
                segment.totalDevices += deviceCount;
                segment.customers.push(customer);
                break;
              }
            }
          });

          // HİZMET BEDELİ ANALİZİ - Cihazların ödeme durumları (global deviceCountByCustomer kullanılıyor)
          let monthlyFeeDevices = 0;
          let yearlyFeeDevices = 0;
          let noFeeDevices = 0;
          let totalActiveServiceDevices = 0;
          
          const monthlyFeeCustomers: Customer[] = [];
          const yearlyFeeCustomers: Customer[] = [];
          const noFeeCustomers: Customer[] = [];
          
          // ✅ ARRAY SAFETY: Ensure customers is a valid array
          const safeCustomers7 = Array.isArray(customers) ? customers : [];
          safeCustomers7.forEach(customer => {
            const deviceData = deviceCountByCustomer.get(customer.id);
            const customerDeviceCount = deviceData?.total || 0;
            
            if (customerDeviceCount > 0) {
              if (customer.serviceFeeSettings && customer.serviceFeeSettings.isActive) {
                // Hizmet bedeli aktif olan müşteriler
                const activeDevices = customer.serviceFeeSettings.deviceSubscriptions?.filter(d => d.isActive).length || 0;
                totalActiveServiceDevices += activeDevices;
                
                if (customer.serviceFeeSettings.paymentType === 'monthly') {
                  monthlyFeeDevices += activeDevices || customerDeviceCount;
                  monthlyFeeCustomers.push(customer);
                } else if (customer.serviceFeeSettings.paymentType === 'yearly') {
                  yearlyFeeDevices += activeDevices || customerDeviceCount;
                  yearlyFeeCustomers.push(customer);
                }
              } else {
                // Hizmet bedeli olmayan müşteriler
                noFeeDevices += customerDeviceCount;
                noFeeCustomers.push(customer);
              }
            }
          });

          // BANKA/PF ÜİY DAĞILIMI ANALİZİ (Cari Dağılımı)
          const totalTabelaRecords = bankPFRecords.reduce((sum, r) => sum + (r.tabelaRecords?.length || 0), 0);
          const totalHakedisRecords = bankPFRecords.reduce((sum, r) => sum + (r.hakedisRecords?.length || 0), 0);
          const totalTabelaGroups = bankPFRecords.reduce((sum, r) => sum + (r.tabelaGroups?.length || 0), 0);
          const activeTabelaGroups = bankPFRecords.reduce((sum, r) => 
            sum + (r.tabelaGroups?.filter(g => g.aktif).length || 0), 0
          );

          // Her Banka/PF firmasına atanmış müşterileri hesapla
          const bankPFCustomerAnalysis = bankPFRecords.map(firma => {
            // Bu firmaya atanmış müşterileri bul
            const assignedCustomers = customers.filter(c => 
              c.linkedBankPFIds && c.linkedBankPFIds.includes(firma.id)
            );
            const activeAssignedCustomers = assignedCustomers.filter(c => c.durum === 'Aktif');
            
            // Debug log
            if (assignedCustomers.length > 0) {
              logger.debug(`Banka/PF atanmış müşteriler: ${firma.firmaUnvan}`, {
                firmaId: firma.id,
                toplamUye: assignedCustomers.length,
                aktifUye: activeAssignedCustomers.length,
                musteriSayisi: assignedCustomers.length
              });
            }
            
            // Toplam cihaz sayısını hesapla (global deviceCountByCustomer kullanılıyor)
            let totalDevices = 0;
            // ✅ ARRAY SAFETY: Ensure assignedCustomers is a valid array
            const safeAssignedCustomers1 = Array.isArray(assignedCustomers) ? assignedCustomers : [];
            safeAssignedCustomers1.forEach(c => {
              const deviceData = deviceCountByCustomer.get(c.id);
              if (deviceData) {
                totalDevices += deviceData.total;
              }
            });
            
            // Customer listesini hazırla
            const customerItems = safeAssignedCustomers1.map(c => ({
              id: c.id,
              name: c.cariAdi,
              subtitle: c.cariHesapKodu,
              value: c.durum
            }));
            
            return {
              firma: firma.firmaUnvan,
              banka: firma.selectedBanka || 'Belirtilmemiş',
              epk: firma.epk || 'Belirtilmemiş',
              totalUye: assignedCustomers.length,
              activeUye: activeAssignedCustomers.length,
              totalDevices: Math.round(totalDevices),
              customers: assignedCustomers,
              customerItems: customerItems  // Memoized list
            };
          }).sort((a, b) => b.totalUye - a.totalUye);

          // Toplam atanmış üye sayısı
          const totalAssignedCustomers = customers.filter(c => 
            c.linkedBankPFIds && c.linkedBankPFIds.length > 0
          ).length;
          
          // Debug: Atanmış müşteri analizi
          logger.debug('Banka/PF ÜİY Dağılımı', {
            totalCustomers: customers.length,
            totalBankPF: bankPFRecords.length,
            assignedCustomers: totalAssignedCustomers,
            assignmentPercentage: customers.length > 0 
              ? `${Math.round((totalAssignedCustomers / customers.length) * 100)}%` 
              : '0%',
            bankPFWithCustomers: bankPFCustomerAnalysis.filter(b => b.totalUye > 0).length
          });
          
          // Atanmamış müşteriler
          const unassignedBankPFCustomers = customers.filter(c => 
            !c.linkedBankPFIds || c.linkedBankPFIds.length === 0
          );

          // En büyük müşteriler (cihaz sayısına göre top 5)
          const topCustomersByDevices = customers
            .map(customer => {
              const deviceData = deviceCountByCustomer.get(customer.id);
              return {
                customer,
                deviceCount: deviceData?.total || 0
              };
            })
            .filter(item => item.deviceCount > 0)
            .sort((a, b) => b.deviceCount - a.deviceCount)
            .slice(0, 5);

          // GELİR ANALİZİ
          const totalHesapKalemleri = hesapKalemleri.length;
          const totalSabitKomisyon = sabitKomisyonlar.reduce((sum, sk) => {
            const oran = typeof sk.oran === 'number' ? sk.oran : parseFloat(String(sk.oran || 0).replace(',', '.'));
            return sum + (isNaN(oran) ? 0 : oran);
          }, 0);
          const totalEkGelir = ekGelirler.reduce((sum, eg) => {
            const tutar = typeof eg.tutar === 'number' ? eg.tutar : parseFloat(String(eg.tutar || 0).replace(',', '.'));
            return sum + (isNaN(tutar) ? 0 : tutar);
          }, 0);

          // Gelir modeli dağılımı
          const gelirModeliStats = sharings.reduce((acc, sharing) => {
            const existing = acc.find(s => s.model === sharing.ad);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ model: sharing.ad, count: 1 });
            }
            return acc;
          }, [] as { model: string; count: number }[]);

          // ÜRÜN ANALİZİ
          const domainStats = payterProducts.reduce((acc, product) => {
            const domain = product.domain || 'Belirtilmemiş';
            const existing = acc.find(d => d.domain === domain);
            if (existing) {
              existing.count++;
              existing.products.push(product);
            } else {
              acc.push({ domain, count: 1, products: [product] });
            }
            return acc;
          }, [] as { domain: string; count: number; products: PayterProduct[] }[]).sort((a, b) => b.count - a.count);

          // SATIŞ TEMSİLCİSİ ANALİZİ (global deviceCountByCustomer kullanılıyor)
          const salesRepAnalysis = salesReps.map(rep => {
            const assignedCustomers = customers.filter(c => c.salesRepId === rep.id);
            const activeCustomers = assignedCustomers.filter(c => c.durum === 'Aktif');
            
            let totalDevices = 0;
            // ✅ ARRAY SAFETY: Ensure assignedCustomers is a valid array
            const safeAssignedCustomers2 = Array.isArray(assignedCustomers) ? assignedCustomers : [];
            safeAssignedCustomers2.forEach(c => {
              const deviceData = deviceCountByCustomer.get(c.id);
              if (deviceData) {
                totalDevices += deviceData.total;
              }
            });
            
            return {
              rep: rep.adSoyad,
              totalCustomers: safeAssignedCustomers2.length,
              activeCustomers: activeCustomers.length,
              totalDevices: totalDevices
            };
          }).filter(r => r.totalCustomers > 0).sort((a, b) => b.totalCustomers - a.totalCustomers);

          const unassignedCustomers = customers.filter(c => !c.salesRepId || !salesReps.find(r => r.id === c.salesRepId));

          // TANIMLAR ANALİZİ
          const tanimlarStats = {
            mcc: { total: mccList.length, active: mccList.filter(m => m.aktif).length },
            banks: { total: banks.length, active: banks.filter(b => b.aktif).length },
            epk: { total: epkList.length, active: epkList.filter(e => e.aktif).length },
            ok: { total: okList.length, active: okList.filter(o => o.aktif).length },
            partnerships: { total: partnerships.length, active: partnerships.filter(p => p.aktif).length },
            kartProgram: { total: kartProgramlar.length, active: kartProgramlar.filter(k => k.aktif).length },
            salesReps: { total: salesReps.length, active: salesReps.filter(s => s.aktif).length }
          };

          // Grafikler için renkler
          const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

          return (
            <DashboardHome
              customers={customers}
              bankPFRecords={bankPFRecords}
              payterProducts={payterProducts}
              banks={banks}
              epkList={epkList}
              okList={okList}
              mccList={mccList}
              salesReps={salesReps}
              jobTitles={jobTitles}
              partnerships={partnerships}
              sharings={sharings}
              kartProgramlar={kartProgramlar}
              hesapKalemleri={hesapKalemleri}
              sabitKomisyonlar={sabitKomisyonlar}
              ekGelirler={ekGelirler}
              onCustomersChange={setCustomers}
              onBankPFRecordsChange={setBankPFRecords}
              onPayterProductsChange={setPayterProducts}
              onMCCListChange={setMCCList}
              onBanksChange={setBanks}
              onEPKListChange={setEPKList}
              onOKListChange={setOKList}
              onSalesRepsChange={setSalesReps}
              onJobTitlesChange={setJobTitles}
              onPartnershipsChange={setPartnerships}
              onSharingsChange={setSharings}
              onKartProgramlarChange={setKartProgramlar}
              onHesapKalemleriChange={setHesapKalemleri}
              onSabitKomisyonlarChange={setSabitKomisyonlar}
              onEkGelirlerChange={setEkGelirler}
              onExportData={() => {
                const exportData = {
                  version: CURRENT_APP_VERSION,
                  exportDate: new Date().toISOString(),
                  data: {
                    customers,
                    payterProducts,
                    bankPFRecords,
                    hesapKalemleri,
                    sabitKomisyonlar,
                    ekGelirler,
                    jobTitles,
                    mccList,
                    banks,
                    epkList,
                    okList,
                    partnerships,
                    sharings,
                    kartProgramlar,
                    salesReps,
                    suspensionReasons
                  }
                };
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `oxivo-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                toast.success('JSON dosyası başarıyla indirildi!');
              }}
              onImportData={handleJSONImport}
              onCheckData={() => {
                const totalTabelaRecords = bankPFRecords.reduce((sum, record) => 
                  sum + (record.tabelaRecords?.length || 0), 0
                );
                
                toast.success(
                  `📊 Veri Özeti:\n\n` +
                  `• Müşteriler: ${customers.length}\n` +
                  `• Banka/PF: ${bankPFRecords.length}\n` +
                  `• TABELA: ${totalTabelaRecords}\n` +
                  `• Bankalar: ${banks.length}\n` +
                  `• EPK: ${epkList.length}\n` +
                  `• ÖK: ${okList.length}`,
                  { duration: 5000 }
                );
              }}
              onClearData={async () => {
                if (confirm('⚠️ TÜM VERİLER SİLİNECEK!\n\nOnce export aldığınızdan emin olun.\n\nDevam etmek istiyor musunuz?')) {
                  toast.info('Veriler temizleniyor...');
                  // Not: Veriler Supabase'de tutulduğu için sayfa yenilendiğinde tekrar yüklenir
                  // Kalıcı silme için Supabase Dashboard'dan yapılmalı
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
            />
          );
        })()}

        {activeModule === 'home_old' && (() => {
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analiz Platformu (ESKİ)</h2>
                  <p className="text-sm text-gray-500 mt-1">Tüm modüllerden özet bilgiler ve detaylı analizler</p>
                </div>
                <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 transition-colors"
                  onClick={() => {
                    const exportData = {
                      version: CURRENT_APP_VERSION,
                      exportDate: new Date().toISOString(),
                      data: {
                        customers,
                        payterProducts,
                        bankPFRecords,
                        hesapKalemleri,
                        sabitKomisyonlar,
                        ekGelirler,
                        jobTitles,
                        mccList,
                        banks,
                        epkList,
                        okList,
                        partnerships,
                        sharings,
                        kartProgramlar,
                        salesReps
                      }
                    };
                    
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `oxivo-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    toast.success('JSON dosyası başarıyla indirildi!');
                  }}
                >
                  <Download size={16} />
                  JSON Export
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const importData = JSON.parse(event.target?.result as string);
                          
                          logger.debug('📦 JSON Import başlıyor...');
                          logger.debug('📄 Dosya adı:', file.name);
                          logger.debug('🔖 Import edilen versiyon:', importData.version || '(Bilinmiyor)');
                          logger.debug('🔖 Mevcut uygulama versiyonu:', CURRENT_APP_VERSION);
                          
                          // ✅ 1. VALIDATION - Veri yapısını kontrol et
                          const validation = validateImportData(importData);
                          if (!validation.valid) {
                            logger.error('❌ Validasyon hataları:', validation.errors);
                            toast.error(validation.errors[0]);
                            
                            // Detailed error log
                            if (FeatureFlags.ENABLE_DEBUG_LOGS) {
                              logger.debug('🔍 Validasyon Detayları:', validation.errors);
                            }
                            return;
                          }
                          
                          // ✅ 2. VERSION CHECK & MIGRATION
                          let processedData = importData;
                          const importVersion = importData.version || '1.0';
                          
                          if (importVersion !== CURRENT_APP_VERSION) {
                            logger.debug(`🔄 Version mismatch detected: v${importVersion} → v${CURRENT_APP_VERSION}`);
                            logger.debug('🔧 Migration başlatılıyor...');
                            
                            // Migration uygula
                            processedData = migrateData(importData, importVersion);
                            logger.debug('✅ Migration tamamlandı');
                          } else {
                            logger.debug('✅ Version match - Migration gerekmiyor');
                          }
                          
                          // ✅ 3. DATA IMPORT - Verileri güncelle
                          logger.debug('💾 Veriler state\'e aktarılıyor...');
                          
                          const data = processedData.data;
                          let importedCount = 0;
                          
                          if (data.customers) { 
                            setCustomers(data.customers); 
                            importedCount++;
                            logger.debug(`  ✓ Müşteriler: ${data.customers.length} kayıt`);
                          }
                          if (data.payterProducts) { 
                            setPayterProducts(data.payterProducts); 
                            importedCount++;
                            logger.debug(`  ✓ Payter Ürünleri: ${data.payterProducts.length} kayıt`);
                          }
                          if (data.bankPFRecords) { 
                            setBankPFRecords(data.bankPFRecords); 
                            importedCount++;
                            const totalTabela = data.bankPFRecords.reduce((sum: number, r: BankPF) => 
                              sum + (r.tabelaRecords?.length || 0), 0
                            );
                            logger.debug(`  ✓ Banka/PF: ${data.bankPFRecords.length} kayıt (${totalTabela} TABELA)`);
                          }
                          if (data.hesapKalemleri) { 
                            setHesapKalemleri(data.hesapKalemleri); 
                            importedCount++;
                            logger.debug(`  ✓ Hesap Kalemleri: ${data.hesapKalemleri.length} kayıt`);
                          }
                          if (data.sabitKomisyonlar) { 
                            setSabitKomisyonlar(data.sabitKomisyonlar); 
                            importedCount++;
                            logger.debug(`  ✓ Sabit Komisyonlar: ${data.sabitKomisyonlar.length} kayıt`);
                          }
                          if (data.ekGelirler) { 
                            setEkGelirler(data.ekGelirler); 
                            importedCount++;
                            logger.debug(`  ✓ Ek Gelirler: ${data.ekGelirler.length} kayıt`);
                          }
                          if (data.jobTitles) { 
                            setJobTitles(data.jobTitles); 
                            importedCount++;
                            logger.debug(`  ✓ Görevler: ${data.jobTitles.length} kayıt`);
                          }
                          if (data.mccList) { 
                            setMCCList(data.mccList); 
                            importedCount++;
                            logger.debug(`  ✓ MCC: ${data.mccList.length} kayıt`);
                          }
                          if (data.banks) { 
                            setBanks(data.banks); 
                            importedCount++;
                            logger.debug(`  ✓ Bankalar: ${data.banks.length} kayıt`);
                          }
                          if (data.epkList) { 
                            setEPKList(data.epkList); 
                            importedCount++;
                            logger.debug(`  ✓ EPK: ${data.epkList.length} kayıt`);
                          }
                          if (data.okList) { 
                            setOKList(data.okList); 
                            importedCount++;
                            logger.debug(`  ✓ ÖK: ${data.okList.length} kayıt`);
                          }
                          if (data.partnerships) { 
                            setPartnerships(data.partnerships); 
                            importedCount++;
                            logger.debug(`  ✓ İşbirlikleri: ${data.partnerships.length} kayıt`);
                          }
                          if (data.sharings) { 
                            setSharings(data.sharings); 
                            importedCount++;
                            logger.debug(`  ✓ Gelir Modelleri: ${data.sharings.length} kayıt`);
                          }
                          if (data.kartProgramlar) { 
                            setKartProgramlar(data.kartProgramlar); 
                            importedCount++;
                            logger.debug(`  ✓ Kart Programları: ${data.kartProgramlar.length} kayıt`);
                          }
                          if (data.salesReps) { 
                            setSalesReps(data.salesReps); 
                            importedCount++;
                            logger.debug(`  ✓ Satış Temsilcileri: ${data.salesReps.length} kayıt`);
                          }
                          if (data.suspensionReasons) { 
                            setSuspensionReasons(data.suspensionReasons); 
                            importedCount++;
                            logger.debug(`  ✓ Dondurma Sebepleri: ${data.suspensionReasons.length} kayıt`);
                          }
                          
                          logger.debug(`✅ ${importedCount} veri kategorisi başarıyla import edildi`);
                          
                          toast.success(
                            importVersion !== CURRENT_APP_VERSION
                              ? `✅ Import başarılı! (v${importVersion} → v${CURRENT_APP_VERSION} migration uygulandı)`
                              : `✅ Import başarılı! (v${importVersion})`
                          );
                        } catch (error) {
                          logger.error('❌ JSON import hatası:', error);
                          toast.error(`JSON dosyası okunamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
                        }
                      };
                      reader.readAsText(file);
                    };
                    input.click();
                  }}
                >
                  <Upload size={16} />
                  JSON Import
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                  onClick={handleDeduplication}
                  title="Supabase'deki duplicate kayıtları temizle"
                >
                  <RefreshCw size={16} />
                  Duplicate Temizle
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  onClick={() => {
                    const totalTabelaRecords = bankPFRecords.reduce((sum, record) => 
                      sum + (record.tabelaRecords?.length || 0), 0
                    );
                    
                    // Detaylı TABELA bilgisi
                    // Log TABELA details (dev only)
                    const safeBankPFRecords2 = Array.isArray(bankPFRecords) ? bankPFRecords : [];
                    if (isDev) {
                      const tabelaDetails = safeBankPFRecords2
                        .filter(record => record.tabelaRecords && record.tabelaRecords.length > 0)
                        .map(record => ({
                          firma: record.firmaUnvan,
                          count: record.tabelaRecords?.length || 0
                        }));
                      logger.debug('📋 TABELA Detayları:', tabelaDetails);
                      
                      const dataCount = {
                        'Müşteriler': customers.length,
                        'Banka/PF': bankPFRecords.length,
                        'TABELA (Toplam)': totalTabelaRecords,
                        'Bankalar': banks.length,
                        'EPK': epkList.length,
                        'ÖK': okList.length,
                      };
                      logger.debug('📊 Kayıtlı Veriler:', dataCount);
                    }
                    
                    toast.success(`Toplam ${totalTabelaRecords} TABELA kaydı - Detaylar konsolda`);
                  }}
                >
                  <Search size={16} />
                  Verileri Kontrol Et
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                  onClick={async () => {
                    if (confirm('⚠️ TÜM VERİLER SİLİNECEK!\n\nOnce export aldığınızdan emin olun.\n\nDevam etmek istiyor musunuz?')) {
                      toast.info('Veriler temizleniyor...');
                      // Not: Veriler Supabase'de tutulduğu için sayfa yenilendiğinde tekrar yüklenir
                      // Kalıcı silme için Supabase Dashboard'dan yapılmalı
                      setTimeout(() => window.location.reload(), 1000);
                    }
                  }}
                >
                  <Trash2 size={16} />
                  Tüm Verileri Temizle
                </Button>
              </div>
            </div>

            {/* Excel Data Manager */}
            <Suspense fallback={<div className="text-center py-6 text-gray-500">Excel yönetici yükleniyor...</div>}>
              <ExcelDataManager
              customers={customers}
              onCustomersChange={setCustomers}
              payterProducts={payterProducts}
              onPayterProductsChange={setPayterProducts}
              bankPFRecords={bankPFRecords}
              onBankPFRecordsChange={setBankPFRecords}
              hesapKalemleri={hesapKalemleri}
              onHesapKalemleriChange={setHesapKalemleri}
              sabitKomisyonlar={sabitKomisyonlar}
              onSabitKomisyonlarChange={setSabitKomisyonlar}
              ekGelirler={ekGelirler}
              onEkGelirlerChange={setEkGelirler}
              jobTitles={jobTitles}
              onJobTitlesChange={setJobTitles}
              mccList={mccList}
              onMCCListChange={setMCCList}
              banks={banks}
              onBanksChange={setBanks}
              epkList={epkList}
              onEPKListChange={setEPKList}
              okList={okList}
              onOKListChange={setOKList}
              partnerships={partnerships}
              onPartnershipsChange={setPartnerships}
              sharings={sharings}
              onSharingsChange={setSharings}
              kartProgramlar={kartProgramlar}
              onKartProgramlarChange={setKartProgramlar}
              salesReps={salesReps}
              onSalesRepsChange={setSalesReps}
              />
            </Suspense>

            {/* YENİ DASHBOARD - Özelleştirilebilir Widget Sistemi */}
            <Suspense fallback={<ModuleLoadingFallback />}>
              <DashboardHome
              customers={customers}
              bankPFRecords={bankPFRecords}
              payterProducts={payterProducts}
              banks={banks}
              epkList={epkList}
              okList={okList}
              mccList={mccList}
              salesReps={salesReps}
              jobTitles={jobTitles}
              partnerships={partnerships}
              sharings={sharings}
              kartProgramlar={kartProgramlar}
              hesapKalemleri={hesapKalemleri}
              sabitKomisyonlar={sabitKomisyonlar}
              ekGelirler={ekGelirler}
              onCustomersChange={setCustomers}
              onBankPFRecordsChange={setBankPFRecords}
              onPayterProductsChange={setPayterProducts}
              onMCCListChange={setMCCList}
              onBanksChange={setBanks}
              onEPKListChange={setEPKList}
              onOKListChange={setOKList}
              onSalesRepsChange={setSalesReps}
              onJobTitlesChange={setJobTitles}
              onPartnershipsChange={setPartnerships}
              onSharingsChange={setSharings}
              onKartProgramlarChange={setKartProgramlar}
              onHesapKalemleriChange={setHesapKalemleri}
              onSabitKomisyonlarChange={setSabitKomisyonlar}
              onEkGelirlerChange={setEkGelirler}
              onExportData={() => {
                const exportData = {
                  version: CURRENT_APP_VERSION,
                  exportDate: new Date().toISOString(),
                  data: {
                    customers,
                    payterProducts,
                    bankPFRecords,
                    hesapKalemleri,
                    sabitKomisyonlar,
                    ekGelirler,
                    jobTitles,
                    mccList,
                    banks,
                    epkList,
                    okList,
                    partnerships,
                    sharings,
                    kartProgramlar,
                    salesReps
                  }
                };
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `oxivo-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                toast.success('JSON dosyası başarıyla indirildi!');
              }}
              onImportData={handleJSONImport}
              onCheckData={() => {
                const totalTabelaRecords = bankPFRecords.reduce((sum, record) => 
                  sum + (record.tabelaRecords?.length || 0), 0
                );
                
                // Log TABELA details (dev only)
                const safeBankPFRecords3 = Array.isArray(bankPFRecords) ? bankPFRecords : [];
                if (isDev) {
                  const tabelaDetails = safeBankPFRecords3
                    .filter(record => record.tabelaRecords && record.tabelaRecords.length > 0)
                    .map(record => ({
                      firma: record.firmaUnvan,
                      count: record.tabelaRecords?.length || 0
                    }));
                  logger.debug('📋 TABELA Detayları:', tabelaDetails);
                  
                  const dataCount = {
                    'Müşteriler': customers.length,
                    'Banka/PF': bankPFRecords.length,
                    'TABELA (Toplam)': totalTabelaRecords,
                    'Bankalar': banks.length,
                    'EPK': epkList.length,
                    'ÖK': okList.length,
                  };
                  logger.debug('📊 Kayıtlı Veriler:', dataCount);
                }
                
                toast.success(`Toplam ${totalTabelaRecords} TABELA kaydı - Detaylar konsolda`);
              }}
              onClearData={async () => {
                if (confirm('⚠️ TÜM VERİLER SİLİNECEK!\n\nOnce export aldığınızdan emin olun.\n\nDevam etmek istiyor musunuz?')) {
                  toast.info('Veriler temizleniyor...');
                  // Not: Veriler Supabase'de tutulduğu için sayfa yenilendiğinde tekrar yüklenir
                  // Kalıcı silme için Supabase Dashboard'dan yapılmalı
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
              />
            </Suspense>
          </div>
        );
        })()}

        {/* ============================================================
            ESKİ DASHBOARD İÇERİĞİ SİLİNDİ (SATIR 1524-2052)
            YENİ DASHBOARD TABLOLARI EKLENECEK
            ============================================================ */}

        {/* ==================== MODULE DEFINITIONS ==================== */}
        
        {/* ⚡ LOADING STATE - Show skeleton while data loads */}
        {!dataLoaded && (
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {dataLoaded && activeModule === 'customers' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <CustomerModule 
              mccList={activeMCCListForCustomer}
              customers={customers}
              onCustomersChange={setCustomers}
              payterProducts={payterProducts}
              bankPFRecords={bankPFRecords}
              banks={activeBanks}
              epkList={activeEPKs}
              okList={activeOKs}
              salesReps={activeSalesReps}
              suspensionReasons={suspensionReasons}
              onBankPFNavigate={handleBankPFNavigate}
              isReadOnly={isViewer}
            />
          </Suspense>
        )}
        {dataLoaded && activeModule === 'bankpf' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <BankPFModule 
              gorevListesi={gorevListesiForBankPF}
              gelirModelleri={gelirModelleriForBankPF}
              ekGelirler={ekGelirler}
              hesapKalemleri={hesapKalemleriForBankPF}
              banks={activeBanks}
              epkList={activeEPKs}
              okList={activeOKs}
              kartProgramlar={activeKartProgramlar}
              bankPFRecords={bankPFRecords}
              onBankPFRecordsChange={setBankPFRecords}
              selectedBankPFId={selectedBankPFId}
              onClearSelectedBankPFId={handleClearSelectedBankPFId}
              onDeleteBankPF={handleDeleteBankPF}
              isReadOnly={isViewer}
            />
          </Suspense>
        )}
        {dataLoaded && activeModule === 'reports' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ReportsModule
              customers={customers}
              bankPFRecords={bankPFRecords}
              banks={banks}
              epkList={epkList}
              okList={okList}
              kartProgramlar={kartProgramlar}
            />
          </Suspense>
        )}
        {dataLoaded && activeModule === 'products' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ProductModule 
              payterProducts={payterProducts}
              onPayterProductsChange={setPayterProducts}
              customers={customers}
              isReadOnly={isViewer}
            />
          </Suspense>
        )}
        {dataLoaded && activeModule === 'revenue' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <RevenueModule
              customers={customers}
              payterProducts={payterProducts}
              onUpdateCustomer={handleUpdateCustomer}
              suspensionReasons={suspensionReasons}
              isReadOnly={isViewer}
            />
          </Suspense>
        )}
        {dataLoaded && activeModule === 'definitions' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <DefinitionsModule
              jobTitles={jobTitles}
              onJobTitlesChange={setJobTitles}
              mccList={mccList}
              onMCCListChange={setMCCList}
              banks={banks}
              onBanksChange={setBanks}
              epkList={epkList}
              onEPKListChange={setEPKList}
              okList={okList}
              onOKListChange={setOKList}
              partnerships={partnerships}
              onPartnershipsChange={setPartnerships}
              sharings={sharings}
              onSharingsChange={setSharings}
              hesapKalemleri={hesapKalemleri}
              onHesapKalemleriChange={setHesapKalemleri}
              sabitKomisyonlar={sabitKomisyonlar}
              onSabitKomisyonlarChange={setSabitKomisyonlar}
              ekGelirler={ekGelirler}
              onEkGelirlerChange={setEkGelirler}
              kartProgramlar={kartProgramlar}
              onKartProgramlarChange={setKartProgramlar}
              salesReps={salesReps}
              onSalesRepsChange={setSalesReps}
              suspensionReasons={suspensionReasons}
              onSuspensionReasonsChange={setSuspensionReasons}
              customers={customers}
              bankPFRecords={bankPFRecords}
              isReadOnly={isViewer}
            />
          </Suspense>
        )}
        {dataLoaded && activeModule === 'dsym' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <DSYMModule />
          </Suspense>
        )}
        {activeModule === 'dataInspector' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <SupabaseDataInspector />
          </Suspense>
        )}
        {activeModule === 'migration' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <div className="p-6">
              <SupabaseFullMigration />
            </div>
          </Suspense>
        )}
      </main>
      
      {/* Global Search Dialog */}
      {dataLoaded && (
        <Suspense fallback={null}>
          <GlobalSearch
            isOpen={isGlobalSearchOpen}
            onClose={() => setIsGlobalSearchOpen(false)}
            onNavigate={handleSearchNavigate}
            onSearch={globalSearch.search}
            totalIndexedItems={globalSearch.totalIndexedItems}
          />
        </Suspense>
      )}

      {/* Activity Log Viewer */}
      {dataLoaded && (
        <Suspense fallback={null}>
          <ActivityLogViewer
            isOpen={isActivityLogOpen}
            onClose={() => setIsActivityLogOpen(false)}
          />
        </Suspense>
      )}
      
      <Toaster position="top-right" />
      
      {/* Environment Badge (Development/Preview only) */}
      <EnvironmentBadge />
    </div>
  );
}
