// Domain eşleştirme utility fonksiyonları
// Tüm Dashboard widget'ları ve raporlar için ortak kullanım

import type { DomainNode } from '../components/CustomerModule';

/**
 * Domain normalizasyon fonksiyonu
 * HTTP/HTTPS protokollerini ve trailing slash'i kaldırır, küçük harfe çevirir
 */
export function normalizeDomain(domain: string | undefined): string {
  if (!domain) return '';
  return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Domain eşleştirme fonksiyonu (Ana Domain görmezden gelme desteği ile)
 * 
 * @param productDomain - Ürünün domain'i
 * @param customerDomain - Müşterinin ana domain'i
 * @param ignoreMainDomain - Ana domain'i görmezden gel, sadece alt domainleri eşleştir
 * @param domainHierarchy - Müşterinin domain hiyerarşisi (tek kelime domain'ler için)
 * @returns Eşleşme durumu (true/false)
 */
export function matchDomain(
  productDomain: string | undefined,
  customerDomain: string | undefined,
  ignoreMainDomain: boolean = false,
  domainHierarchy?: DomainNode[]
): boolean {
  const normalizedProduct = normalizeDomain(productDomain);
  const normalizedCustomer = normalizeDomain(customerDomain);
  
  if (!normalizedProduct || !normalizedCustomer) {
    return false;
  }
  
  if (ignoreMainDomain) {
    // Ana domain'i görmezden gel, SADECE alt domainleri kabul et
    
    // 1. Ana domain eşleşmesini engelle (tam eşleşme varsa false döndür)
    if (normalizedProduct === normalizedCustomer) {
      return false;
    }
    
    // 2. Normal alt domain formatı kontrolü (nokta notation: subdomain.maindomain)
    if (normalizedProduct.endsWith('.' + normalizedCustomer)) {
      return true;
    }
    
    // 3. 🔥 Domain Hiyerarşisinde alt domain olarak tanımlı mı? (tek kelime domain'ler için)
    // Örnek: Ana domain "SIPAY34", Alt domain "TINTCAFE" (hiyerarşide tanımlı)
    // Ürün domain'i "TINTCAFE" ise eşleştir
    if (domainHierarchy && domainHierarchy.length > 0) {
      const allSubdomains = new Set<string>();
      
      const collectSubdomains = (nodes: DomainNode[]) => {
        nodes.forEach(node => {
          if (node.name && node.name.trim()) {
            allSubdomains.add(normalizeDomain(node.name));
          }
          if (node.children && node.children.length > 0) {
            collectSubdomains(node.children);
          }
        });
      };
      
      collectSubdomains(domainHierarchy);
      
      if (allSubdomains.has(normalizedProduct)) {
        return true;
      }
    }
    
    return false;
  } else {
    // Normal mod: Tam eşleşme (Ana domain eşleştirmesi)
    return normalizedProduct === normalizedCustomer;
  }
}

/**
 * Müşterinin tüm domain'lerini topla (ana domain + tüm alt domain'ler)
 * Domain hiyerarşisinden recursive olarak tüm domain'leri çıkarır
 */
export function collectAllDomainsFromHierarchy(
  mainDomain: string | undefined,
  domainHierarchy?: DomainNode[]
): string[] {
  const domains: string[] = [];
  
  // Ana domain ekle
  if (mainDomain && mainDomain.trim()) {
    domains.push(normalizeDomain(mainDomain));
  }
  
  // Domain hiyerarşisinden tüm domain'leri topla (recursive)
  if (domainHierarchy && domainHierarchy.length > 0) {
    const collectFromHierarchy = (nodes: DomainNode[]) => {
      nodes.forEach(node => {
        if (node.name && node.name.trim()) {
          domains.push(normalizeDomain(node.name));
        }
        if (node.children && node.children.length > 0) {
          collectFromHierarchy(node.children);
        }
      });
    };
    
    collectFromHierarchy(domainHierarchy);
  }
  
  return domains;
}
