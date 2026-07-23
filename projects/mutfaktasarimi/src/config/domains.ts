export interface DomainConfig {
  id: string;
  domainName: string;
  brandTitle: string;
  siteName: string;
  badge: string;
  heroHeading: string;
  heroSubheading: string;
  heroHighlight: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  themeAccent: string;
  primaryFeature: string;
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  "bursamutfaktasarim.com": {
    id: "main",
    domainName: "bursamutfaktasarim.com",
    siteName: "mutfaktasarımı",
    brandTitle: "mutfaktasarımı — Mobilya Dizayn & Linco Modüler Sistem",
    badge: "LİNCO MODÜLER BAĞLANTI & MOBİLYA DİZAYN",
    heroHeading: "Yalın, Zarif ve Lüks",
    heroHighlight: "Mutfak Tasarımları",
    heroSubheading: "MDF Lam, High Gloss ve Lake malzeme seçenekleriyle, Linco Modüler Bağlantı teknolojisi kullanılarak üretilen özel mobilya dizayn koleksiyonu.",
    metaTitle: "mutfaktasarımı | Linco Modüler Bağlantı & Mobilya Dizayn",
    metaDescription: "Yalın ve zarif mutfak tasarımları. Linco Modüler Bağlantı altyapısıyla MDF Lam, High Gloss ve Lake özel mobilya dizayn koleksiyonlarımızı keşfedin.",
    keywords: "mutfaktasarımı, mobilya dizayn, linco modüler bağlantı, mdf lam mutfak, high gloss mutfak, lake mutfak, özel tasarım mobilya",
    canonicalUrl: "https://mutfaktasarimi.vercel.app",
    themeAccent: "#D4AF37",
    primaryFeature: "Linco Modüler Bağlantı Teknolojisi & Mobilya Dizayn"
  },
  "bursaakrilikmutfak.com": {
    id: "akrilik",
    domainName: "bursaakrilikmutfak.com",
    siteName: "mutfaktasarımı",
    brandTitle: "mutfaktasarımı — High Gloss Mobilya Dizayn",
    badge: "HIGH GLOSS MOBİLYA DİZAYN",
    heroHeading: "Yüksek Parlaklıkta",
    heroHighlight: "High Gloss Mutfak Koleksiyonu",
    heroSubheading: "Pürüzsüz akrilik yüzeyler ve Linco modüler bağlantı dayanıklılığı ile tasarlanan mobilya dizayn serileri.",
    metaTitle: "mutfaktasarımı | High Gloss & Akrilik Mobilya Dizayn",
    metaDescription: "High Gloss ve Akrilik kapak teknolojisiyle üretilen zarif mobilya dizayn tasarımları.",
    keywords: "high gloss mutfak, mobilya dizayn, linco modüler bağlantı, mutfaktasarımı",
    canonicalUrl: "https://mutfaktasarimi.vercel.app",
    themeAccent: "#00E5FF",
    primaryFeature: "Linco Modüler Bağlantılı High Gloss Yüzeyler"
  },
  "bursamutfakdekorasyon.com": {
    id: "dekorasyon",
    domainName: "bursamutfakdekorasyon.com",
    siteName: "mutfaktasarımı",
    brandTitle: "mutfaktasarımı — Mobilya Dizayn & Projelendirme",
    badge: "MOBİLYA DİZAYN & MODÜLER SİSTEM",
    heroHeading: "A'dan Z'ye Özel",
    heroHighlight: "Mobilya Dizaynı",
    heroSubheading: "Mekanınızın ölçülerine tam uyum sağlayan, Linco modüler kilit altyapılı mobilya çözümleri.",
    metaTitle: "mutfaktasarımı | Özel Mobilya Dizayn & Projelendirme",
    metaDescription: "Mutfak alanınız için özel ölçü mobilya dizaynı ve Linco modüler montaj çözümleri.",
    keywords: "mobilya dizayn, linco modüler bağlantı, özel ölçü mutfak, mutfaktasarımı",
    canonicalUrl: "https://mutfaktasarimi.vercel.app",
    themeAccent: "#E5A93C",
    primaryFeature: "Linco Modüler Bağlantı & Özel İmalat"
  },
  "bursaluksmutfak.com": {
    id: "luks",
    domainName: "bursaluksmutfak.com",
    siteName: "mutfaktasarımı",
    brandTitle: "mutfaktasarımı — Lake Mobilya Dizayn",
    badge: "PREMIUM LAKE MOBİLYA DİZAYN",
    heroHeading: "Zamana Meydan Okuyan",
    heroHighlight: "İpek Mat Lake Mutfaklar",
    heroSubheading: "İpek mat lake işçiliği, Linco modüler bağlantı gizli montaj sistemi ve özel renk seçenekleriyle mobilya dizaynı.",
    metaTitle: "mutfaktasarımı | İpek Mat Lake Mobilya Dizayn",
    metaDescription: "İpek mat lake kapak işçiliği ve Linco modüler bağlantı sistemiyle hazırlanan elegant mobilya dizayn modelleri.",
    keywords: "lake mutfak, mobilya dizayn, linco modüler bağlantı, mutfaktasarımı",
    canonicalUrl: "https://mutfaktasarimi.vercel.app",
    themeAccent: "#C5A059",
    primaryFeature: "Linco Modüler Gizli Bağlantılı Lake Mobilya"
  },
  "bursamutfaktadilati.com": {
    id: "tadilat",
    domainName: "bursamutfaktadilati.com",
    siteName: "mutfaktasarımı",
    brandTitle: "mutfaktasarımı — MDF Lam Mobilya Dizayn",
    badge: "NATÜREL MDF LAM & LİNCO MODÜLER",
    heroHeading: "Doğal Doku Ve Sıcaklık",
    heroHighlight: "MDF Lam Mutfak Tasarımları",
    heroSubheading: "Ahşap dokulu natürel MDF Lam kapaklar ve Linco modüler bağlantı teknolojisi ile mekanlara uzun ömürlü karakter kazandırın.",
    metaTitle: "mutfaktasarımı | MDF Lam Mobilya Dizayn",
    metaDescription: "Natürel ahşap dokuları ve Linco modüler kilit sistemiyle fark yaratan MDF Lam mobilya dizayn tasarımları.",
    keywords: "mdf lam mutfak, mobilya dizayn, linco modüler bağlantı, mutfaktasarımı",
    canonicalUrl: "https://mutfaktasarimi.vercel.app",
    themeAccent: "#38BDF8",
    primaryFeature: "Linco Modüler Bağlantılı MDF Lam Çözümler"
  }
};

export function getDomainConfig(hostname?: string): DomainConfig {
  if (!hostname) return DOMAIN_CONFIGS["bursamutfaktasarim.com"];
  
  const cleanHost = hostname.toLowerCase().replace(/^www\./, '').split(':')[0];
  
  if (DOMAIN_CONFIGS[cleanHost]) {
    return DOMAIN_CONFIGS[cleanHost];
  }
  
  if (cleanHost.includes('akrilik')) return DOMAIN_CONFIGS["bursaakrilikmutfak.com"];
  if (cleanHost.includes('dekorasyon')) return DOMAIN_CONFIGS["bursamutfakdekorasyon.com"];
  if (cleanHost.includes('luks') || cleanHost.includes('lux')) return DOMAIN_CONFIGS["bursaluksmutfak.com"];
  if (cleanHost.includes('tadilat')) return DOMAIN_CONFIGS["bursamutfaktadilati.com"];
  
  return DOMAIN_CONFIGS["bursamutfaktasarim.com"];
}
