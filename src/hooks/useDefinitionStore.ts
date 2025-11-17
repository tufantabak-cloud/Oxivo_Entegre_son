/**
 * useDefinitionStore - Custom Hook for Definition Management
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Consolidates 22 props from DefinitionsModule into 1 hook
 * - Reduces prop drilling significantly
 * - Provides clean API for definition state management
 * 
 * USAGE:
 * const definitions = useDefinitionStore();
 * <DefinitionsModule {...definitions} />
 * 
 * Created: 2025-11-04 (Phase 2 Optimization)
 */

import { useState, useEffect } from 'react';
import { 
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
  SuspensionReason,
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
} from '../components/DefinitionsModule';

// LocalStorage helper functions with AUTO-REPAIR
const getStoredData = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    
    // 🔧 VERSIONED FORMAT SUPPORT: Check if data is in versioned format
    // Format: { version: "1.0.14", timestamp: "...", data: [...] }
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      // Extract data from versioned wrapper
      const extractedData = parsed.data;
      
      // ✅ AUTO-REPAIR: If extracted data is not array, use default
      if (!Array.isArray(extractedData)) {
        console.warn(`[AUTO-REPAIR] ${key} data is not array in versioned format, using default`, extractedData);
        setStoredData(key, defaultValue); // Auto-save fixed data
        return defaultValue;
      }
      
      return extractedData;
    }
    
    // Legacy format: Direct array or object
    // ✅ AUTO-REPAIR: If legacy data is not array, use default
    if (!Array.isArray(parsed)) {
      console.warn(`[AUTO-REPAIR] ${key} data is not array in legacy format, using default`, parsed);
      setStoredData(key, defaultValue); // Auto-save fixed data
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.error(`[AUTO-REPAIR] Error loading ${key}, using default`, error);
    return defaultValue;
  }
};

const setStoredData = <T,>(key: string, value: T): void => {
  try {
    // 🔧 VERSIONED FORMAT: Wrap data in version metadata
    const versionedData = {
      version: '1.0.14',
      timestamp: new Date().toISOString(),
      data: value
    };
    localStorage.setItem(key, JSON.stringify(versionedData));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Type for the hook return value
export interface DefinitionStore {
  // Job Titles
  jobTitles: JobTitle[];
  setJobTitles: (jobTitles: JobTitle[]) => void;
  
  // MCC List
  mccList: MCC[];
  setMCCList: (mccList: MCC[]) => void;
  
  // Banks
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
  
  // EPK List
  epkList: EPK[];
  setEPKList: (epkList: EPK[]) => void;
  
  // OK List
  okList: OK[];
  setOKList: (okList: OK[]) => void;
  
  // Partnerships
  partnerships: Partnership[];
  setPartnerships: (partnerships: Partnership[]) => void;
  
  // Sharings (Revenue Models)
  sharings: Sharing[];
  setSharings: (sharings: Sharing[]) => void;
  
  // Kart Programlar (Card Programs)
  kartProgramlar: KartProgram[];
  setKartProgramlar: (kartProgramlar: KartProgram[]) => void;
  
  // Hesap Kalemleri (Account Items)
  hesapKalemleri: HesapKalemi[];
  setHesapKalemleri: (hesapKalemleri: HesapKalemi[]) => void;
  
  // Sabit Komisyonlar (Fixed Commissions)
  sabitKomisyonlar: SabitKomisyon[];
  setSabitKomisyonlar: (sabitKomisyonlar: SabitKomisyon[]) => void;
  
  // Ek Gelirler (Additional Income)
  ekGelirler: EkGelir[];
  setEkGelirler: (ekGelirler: EkGelir[]) => void;
  
  // Sales Representatives
  salesReps: SalesRepresentative[];
  setSalesReps: (salesReps: SalesRepresentative[]) => void;
  
  // Suspension Reasons
  suspensionReasons: SuspensionReason[];
  setSuspensionReasons: (reasons: SuspensionReason[]) => void;
}

/**
 * useDefinitionStore Hook
 * 
 * Manages all definition-related state with localStorage persistence
 * 
 * @returns {DefinitionStore} Object containing all definition state and setters
 */
export function useDefinitionStore(): DefinitionStore {
  // ============================================================================
  // STATE INITIALIZATION (with localStorage)
  // ============================================================================
  
  const [jobTitles, setJobTitlesState] = useState<JobTitle[]>(
    () => getStoredData('jobTitles', defaultJobTitles)
  );
  
  const [mccList, setMCCListState] = useState<MCC[]>(
    () => getStoredData('mccList', defaultMCCList)
  );
  
  const [banks, setBanksState] = useState<Bank[]>(
    () => getStoredData('banks', defaultBanks)
  );
  
  const [epkList, setEPKListState] = useState<EPK[]>(
    () => getStoredData('epkList', defaultEPKList)
  );
  
  const [okList, setOKListState] = useState<OK[]>(
    () => getStoredData('okList', defaultOKList)
  );
  
  const [partnerships, setPartnershipsState] = useState<Partnership[]>(
    () => getStoredData('partnerships', defaultPartnerships)
  );
  
  const [sharings, setSharingsState] = useState<Sharing[]>(
    () => getStoredData('sharings', defaultSharings)
  );
  
  const [kartProgramlar, setKartProgramlarState] = useState<KartProgram[]>(
    () => getStoredData('kartProgramlar', defaultKartProgramlar)
  );
  
  const [hesapKalemleri, setHesapKalemleriState] = useState<HesapKalemi[]>(
    () => getStoredData('hesapKalemleri', [])
  );
  
  const [sabitKomisyonlar, setSabitKomisyonlarState] = useState<SabitKomisyon[]>(
    () => getStoredData('sabitKomisyonlar', [])
  );
  
  const [ekGelirler, setEkGelirlerState] = useState<EkGelir[]>(
    () => getStoredData('ekGelirler', [])
  );
  
  const [salesReps, setSalesRepsState] = useState<SalesRepresentative[]>(
    () => getStoredData('salesReps', defaultSalesRepresentatives)
  );
  
  const [suspensionReasons, setSuspensionReasonsState] = useState<SuspensionReason[]>(
    () => getStoredData('suspensionReasons', defaultSuspensionReasons)
  );

  // ============================================================================
  // LOCALSTORAGE PERSISTENCE (auto-save on change)
  // ============================================================================
  
  useEffect(() => { setStoredData('jobTitles', jobTitles); }, [jobTitles]);
  useEffect(() => { setStoredData('mccList', mccList); }, [mccList]);
  useEffect(() => { setStoredData('banks', banks); }, [banks]);
  useEffect(() => { setStoredData('epkList', epkList); }, [epkList]);
  useEffect(() => { setStoredData('okList', okList); }, [okList]);
  useEffect(() => { setStoredData('partnerships', partnerships); }, [partnerships]);
  useEffect(() => { setStoredData('sharings', sharings); }, [sharings]);
  useEffect(() => { setStoredData('kartProgramlar', kartProgramlar); }, [kartProgramlar]);
  useEffect(() => { setStoredData('hesapKalemleri', hesapKalemleri); }, [hesapKalemleri]);
  useEffect(() => { setStoredData('sabitKomisyonlar', sabitKomisyonlar); }, [sabitKomisyonlar]);
  useEffect(() => { setStoredData('ekGelirler', ekGelirler); }, [ekGelirler]);
  useEffect(() => { setStoredData('salesReps', salesReps); }, [salesReps]);
  useEffect(() => { setStoredData('suspensionReasons', suspensionReasons); }, [suspensionReasons]);

  // ============================================================================
  // WRAPPER SETTERS (for consistency with App.tsx API)
  // ============================================================================
  
  const setJobTitles = (newJobTitles: JobTitle[]) => setJobTitlesState(newJobTitles);
  const setMCCList = (newMCCList: MCC[]) => setMCCListState(newMCCList);
  const setBanks = (newBanks: Bank[]) => setBanksState(newBanks);
  const setEPKList = (newEPKList: EPK[]) => setEPKListState(newEPKList);
  const setOKList = (newOKList: OK[]) => setOKListState(newOKList);
  const setPartnerships = (newPartnerships: Partnership[]) => setPartnershipsState(newPartnerships);
  const setSharings = (newSharings: Sharing[]) => setSharingsState(newSharings);
  const setKartProgramlar = (newKartProgramlar: KartProgram[]) => setKartProgramlarState(newKartProgramlar);
  const setHesapKalemleri = (newHesapKalemleri: HesapKalemi[]) => setHesapKalemleriState(newHesapKalemleri);
  const setSabitKomisyonlar = (newSabitKomisyonlar: SabitKomisyon[]) => setSabitKomisyonlarState(newSabitKomisyonlar);
  const setEkGelirler = (newEkGelirler: EkGelir[]) => setEkGelirlerState(newEkGelirler);
  const setSalesReps = (newSalesReps: SalesRepresentative[]) => setSalesRepsState(newSalesReps);
  const setSuspensionReasons = (newReasons: SuspensionReason[]) => setSuspensionReasonsState(newReasons);

  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    // Job Titles
    jobTitles,
    setJobTitles,
    
    // MCC List
    mccList,
    setMCCList,
    
    // Banks
    banks,
    setBanks,
    
    // EPK List
    epkList,
    setEPKList,
    
    // OK List
    okList,
    setOKList,
    
    // Partnerships
    partnerships,
    setPartnerships,
    
    // Sharings
    sharings,
    setSharings,
    
    // Kart Programlar
    kartProgramlar,
    setKartProgramlar,
    
    // Hesap Kalemleri
    hesapKalemleri,
    setHesapKalemleri,
    
    // Sabit Komisyonlar
    sabitKomisyonlar,
    setSabitKomisyonlar,
    
    // Ek Gelirler
    ekGelirler,
    setEkGelirler,
    
    // Sales Representatives
    salesReps,
    setSalesReps,
    
    // Suspension Reasons
    suspensionReasons,
    setSuspensionReasons,
  };
}

/**
 * USAGE EXAMPLE:
 * 
 * // In App.tsx (BEFORE)
 * const [jobTitles, setJobTitles] = useState(...)
 * const [mccList, setMCCList] = useState(...)
 * // ... 10 more state declarations
 * 
 * <DefinitionsModule
 *   jobTitles={jobTitles}
 *   onJobTitlesChange={setJobTitles}
 *   mccList={mccList}
 *   onMCCListChange={setMCCList}
 *   // ... 18 more props
 * />
 * 
 * // In App.tsx (AFTER)
 * const definitions = useDefinitionStore();
 * 
 * <DefinitionsModule
 *   jobTitles={definitions.jobTitles}
 *   onJobTitlesChange={definitions.setJobTitles}
 *   mccList={definitions.mccList}
 *   onMCCListChange={definitions.setMCCList}
 *   // ... still need to pass individually for now
 * />
 * 
 * // FUTURE: Create DefinitionsModuleProps interface that accepts DefinitionStore
 */
