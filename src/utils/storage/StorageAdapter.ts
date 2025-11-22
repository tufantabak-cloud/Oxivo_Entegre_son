/*COMMENT*/

export interface StorageAdapter {
  /*COMMENT*/
  get<T>(key: string): Promise<T | null>;
  
  /*COMMENT*/
  set<T>(key: string, value: T): Promise<void>;
  
  /*COMMENT*/
  remove(key: string): Promise<void>;
  
  /*COMMENT*/
  clear(): Promise<void>;
  
  /*COMMENT*/
  getByPrefix<T>(prefix: string): Promise<Record<string, T>>;
  
  /*COMMENT*/
  keys(): Promise<string[]>;
  
  /*COMMENT*/
  getName(): string;
  
  /*COMMENT*/
  isHealthy(): Promise<boolean>;
}

/*COMMENT*/
export type StorageStrategy = 
  | 'localStorage-primary'   // localStorage önce, Supabase backup
  | 'supabase-primary'       // Supabase önce, localStorage backup
  | 'localStorage-only'      // Sadece localStorage
  | 'supabase-only';         // Sadece Supabase

/*COMMENT*/
export interface StorageConfig {
  strategy: StorageStrategy;
  syncInterval?: number;      // Otomatik sync için interval (ms)
  retryAttempts?: number;     // Retry sayisi
  enableLogging?: boolean;    // Debug log'lari
}


