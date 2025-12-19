# 🔧 is_deleted Hatası Düzeltme Scripti

## SORUN:
Kodda 29 yerde `.eq('is_deleted', false)` kontrolü var ama Supabase'de `is_deleted` sütunu yok!

## ÇÖZÜM:
Aşağıdaki satırları manuel olarak silin:

### 📁 /utils/supabaseClient.ts (20 satır)

1. Satır 395: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
2. Satır 479: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
3. Satır 1021: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
4. Satır 1240: `.eq('is_deleted', false)` → **SİL**
5. Satır 1250: `.eq('is_deleted', false)` → **SİL**
6. Satır 1427: `.eq('is_deleted', false)` → **SİL**
7. Satır 1558: `.eq('is_deleted', false)` → **SİL**
8. Satır 1703: `.eq('is_deleted', false)` → **SİL**
9. Satır 1845: `.eq('is_deleted', false)` → **SİL**
10. Satır 1987: `.eq('is_deleted', false)` → **SİL**
11. Satır 2071: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
12. Satır 2162: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
13. Satır 2299: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
14. Satır 2390: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
15. Satır 2481: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
16. Satır 2572: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
17. Satır 2713: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
18. Satır 2854: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
19. Satır 3220: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
20. Satır 3398: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
21. Satır 3461: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
22. Satır 3601: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**

### 📁 /services/customerService.ts (4 satır)

23. Satır 28: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
24. Satır 50: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
25. Satır 76: `.eq('is_deleted', false); // ✅ SOFT DELETE: Exclude deleted records` → **SİL**
26. Satır 96: `.eq('is_deleted', false) // ✅ SOFT DELETE: Exclude deleted records` → **SİL**

## SONUÇ:
26 satır silindikten sonra Supabase timeout hatası gidecek!
