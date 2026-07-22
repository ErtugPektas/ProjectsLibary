# 🎨 Arya Sanat Akademisi — Reusable Web & CMS Vault

Bu klasör, Arya Sanat Akademisi projesinin tüm ön yüz (UI) bileşenlerini, admin paneli düzenleyicilerini, API endpoint'lerini ve veri şablonlarını barındırır.

---

## 🛠️ Modül ve Bileşen Envanteri

| Kategori | Dosya / Yol | Açıklama |
| :--- | :--- | :--- |
| **Ana Düzen (Layout)** | `layouts/Layout.astro` | Ana HTML yapısı, meta etiketleri, SEO, dinamik CSS teması ve yazı tipleri |
| **Ana Sayfa (Landing)** | `pages/index.astro` | Kurs kartları, duyuru akışı, kahve/akademik konsept hero ve iletişim alanları |
| **Admin Paneli** | `pages/admin/index.astro`, `pages/admin/edit.astro` | İçerik yönetimi, kurs ekleme/düzenleme, duyuru yayını ve ayarlar |
| **API Endpoints** | `pages/api/` | `save-course.js`, `save-announcements.js`, `save-erp.js`, `analytics.js`, `upload-image.js` |
| **Veri Şablonları** | `content/` | Kurs içerikleri (`.md`), site ayarları (`site-settings.json`), ERP verileri (`erp-data.json`) |
| **Veritabanı Servisi** | `utils/redis.js` | Upstash / Redis veritabanı bağlantı katmanı |

---

## 🔄 Gelecek Projelerde Özelleştirme Mantığı (Customization Blueprint)

Yeni bir web sitesi veya portal oluştururken Antigravity'ye vereceğiniz komut örneği:

```text
ProjectsLibary depomuzdaki projects/aryasanatakademisi modülünü temel alarak yeni bir site kur:
- Marka Adı: [Örn: "Müzik & Sanat Kulübü"]
- Kurs/Hizmet Kategorileri: [Örn: "Piyano, Keman, Görsel Sanatlar"]
- Tema Rengi: [Örn: "Koyu Lacivert / Altın"]
- Veritabanı: [Upstash Redis / Yerel JSON]
- Admin Paneli: Aktif
```
