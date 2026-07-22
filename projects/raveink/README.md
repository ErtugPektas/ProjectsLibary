# 🏷️ RaveInk — Vintage ERP & Retail Storefront Vault

Bu modül; perakende mağaza, vintage giyim/takı/kafe ERP sistemleri, stok takibi, müşteri/randevu yönetimi ve ürün sergileme arayüzlerini içerir.

---

## 🛠️ Modül ve Bileşen Envanteri

| Kategori | Dosya / Yol | Açıklama |
| :--- | :--- | :--- |
| **ERP Dashboard** | `erp/src/app/(dashboard)/` | Stok, randevu, sanatçı/personel, finans ve raporlama ekranları |
| **Stok & Envanter** | `erp/src/core/repositories/InventoryRepository.ts` | Ürün ekleme, stok düşme, kategori yönetimi |
| **Finans & İşlemler** | `erp/src/core/repositories/TransactionRepository.ts` | Gelir/gider takibi, satış kayıtları |
| **Veri Katmanı** | `erp/src/infrastructure/repositories/Supabase*.ts` | Supabase veritabanı entegrasyonu |
| **UI Bileşenleri** | `erp/src/components/Sidebar.tsx` | Dinamik navigasyon ve filtreleme panelleri |

---

## 🔄 Gelecek Projelerde Özelleştirme Mantığı

```text
ProjectsLibary depomuzdaki projects/raveink ERP modülünü kullan:
- İşletme Tipi: [Örn: "Kafe & Butik"]
- Modüller: [Stok Takibi, Satış Raporları, Müşteri Kaydı]
- Veritabanı: Supabase
```
