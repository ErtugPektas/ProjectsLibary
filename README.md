# 🏛️ ProjectsLibary — Central Component & Project Vault

Bu depo, şimdiye kadar Antigravity ile geliştirdiğimiz tüm web, mobil, ERP, 3D sahneler ve sistem projelerinin **modüler, yeniden kullanılabilir ve özelleştirilebilir** versiyonlarını barındırır.

---

## 📂 Depo Yapısı (Repository Structure)

```
ProjectsLibary/
├── README.md                            # Ana Kütüphane İndeksi & Çağırma Komutları
├── projects/
│   ├── aryasanatakademisi/              # Sanat Akademisi / Kurs / CMS / Etkinlik Şablonu
│   │   ├── README.md                    # Proje Mimarisi & Değişken Tanımları
│   │   ├── components/                  # Hero, Kartlar, Navigasyon, İletişim Formları
│   │   ├── admin-portal/                # Dinamik İçerik Yönetimi & Admin Editör Arayüzü
│   │   ├── api-handlers/                # Analitik, Görsel Yükleme, Veri Kaydetme API'leri
│   │   └── data-schemas/                # İçerik Şablonları & Ayar Dosyaları
│   ├── raveink/                         # Vintage Mağaza, ERP, Ürün Katalog & Sepet Sistemi
│   │   ├── erp-modules/                 # Stok, Satış, Perakende Yönetimi
│   │   └── storefront/                  # Özel Tasarım Mağaza, Sepet, Ödeme Arayüzü
│   ├── 112-monitor/                     # Canlı Sistem / İzleme / Dashboard Altyapısı
│   └── metaverse-3d/                    # Three.js / 3D Görsel Sahne Bileşenleri
└── shared-core/                         # Ortak CSS Token'ları, Veritabanı (Redis) Bağlantıları
```

---

## 🚀 Gelecekte Kullanım için Hazır Çağırma Komutları (Master Prompt Templates)

Aşağıdaki komutları yeni bir proje başlatırken Antigravity'ye verebilirsiniz:

### 1️⃣ Sanat/Eğitim/Kurumsal Web Sitesi Kurma
> *"ProjectsLibary depomuzdaki `projects/aryasanatakademisi` modülünü temel alarak yeni bir web sitesi oluştur. Sitedeki marka ismini **[Yeni Marka Adı]**, ana renk paletini **[Örn: Lacivert & Altın]**, kurslar/hizmetler bölümünü de **[Örn: Yazılım Eğitimleri]** olarak özelleştir."*

### 2️⃣ E-Ticaret / ERP / Mağaza Sistemi Kurma
> *"ProjectsLibary depomuzdaki `projects/raveink` ERP ve mağaza bileşenlerini kullanarak yeni bir perakende web sitesi scaffold et. Ürün kategorilerini **[Örn: Kahve & Ekipman]** olarak güncelle."*

### 3️⃣ Tam Kütüphane Güncelleme / Yeni Proje Ekleme
> *"Geliştirdiğimiz **[Proje Adı]** projesindeki tüm bileşenleri ve API'leri modüler hale getirerek ProjectsLibary/projects/[proje-adi] altına ekle ve README dosyasını güncelle."*
