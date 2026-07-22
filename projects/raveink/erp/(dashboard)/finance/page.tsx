"use client";

import { useFinance } from "@/presentation/hooks/useFinance";
import { Transaction, AppointmentReceipt } from "@/core/types";
import {
  Plus, Trash2, X, Loader2, ArrowUpRight, ArrowDownRight,
  TrendingUp, Wallet, Landmark, Banknote, Printer
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_LABELS: Record<string, string> = {
  session: "Seans Geliri",
  material: "Malzeme Gideri",
  rent: "Kira Gideri",
  salary: "Maaş/Hakediş",
  other: "Diğer",
};

const PAYMENT_METHODS: Record<string, { label: string; icon: React.ElementType }> = {
  cash: { label: "Nakit", icon: Banknote },
  card: { label: "Kart", icon: Wallet },
  bank_transfer: { label: "Havale/EFT", icon: Landmark },
};

export default function FinancePage() {
  const {
    transactions,
    loading,
    saving,
    showModal,
    setShowModal,
    form,
    deleteConfirm,
    setDeleteConfirm,
    printReceipt,
    setPrintReceipt,
    stats,
    chartData,
    handleSave,
    handleDelete,
    loadAndPrintReceipt,
    handleOpenNew,
    set,
  } = useFinance();

  return (
    <>
      {/* Printable Receipt Frame */}
      {printReceipt && (
        <>
          {/* Screen modal panel */}
          <div className="modal-overlay no-print" onClick={() => setPrintReceipt(null)}>
            <div className="modal-panel" style={{ maxWidth: "420px", padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", gap: "0.5rem" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>✓ Yazdır</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPrintReceipt(null)}>Kapat</button>
              </div>
              
              <div style={{ padding: "2rem", border: "1px solid #C41E3A", background: "#000", color: "#fff", fontFamily: "'Montserrat', sans-serif" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div style={{ fontFamily: "Cinzel, serif", fontSize: 24, fontWeight: 900, letterSpacing: "0.15em" }}>
                    RAVE<span style={{ color: "#C41E3A" }}>INK</span>
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 4 }}>
                    DÖVME &amp; PIERCING STÜDYOSU
                  </div>
                </div>
                <div style={{ fontSize: 11, borderBottom: "1px dashed rgba(255,255,255,0.2)", paddingBottom: 10, marginBottom: 10 }}>
                  <div><strong>Fatura No:</strong> #{printReceipt.id.substring(0, 8).toUpperCase()}</div>
                  <div><strong>Tarih:</strong> {printReceipt.date} · {printReceipt.time}</div>
                </div>
                <div style={{ fontSize: 11, marginBottom: 15 }}>
                  <div style={{ fontWeight: 600, color: "#C41E3A", marginBottom: 4 }}>MÜŞTERİ BİLGİLERİ</div>
                  <div>{printReceipt.customers?.name}</div>
                  <div>{printReceipt.customers?.phone}</div>
                </div>
                <div style={{ fontSize: 11, marginBottom: 15 }}>
                  <div style={{ fontWeight: 600, color: "#C41E3A", marginBottom: 4 }}>SEANS DETAYLARI</div>
                  <div>Hizmet: {printReceipt.service}</div>
                  <div>Sanatçı: {printReceipt.artists?.name}</div>
                </div>
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", borderBottom: "1px dashed rgba(255,255,255,0.2)", padding: "10px 0", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
                  <span>TOPLAM TUTAR</span>
                  <span style={{ color: "#4ade80" }}>₺{Number(printReceipt.price).toLocaleString("tr-TR")}</span>
                </div>
                <div style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: "2rem" }}>
                  Bizi tercih ettiğiniz için teşekkür ederiz.<br />raveinktattoostudio.com
                </div>
              </div>
            </div>
          </div>

          {/* Printable Receipt Frame (Only visible during print) */}
          <div className="print-only-receipt">
            <div style={{ padding: "2rem", border: "1px solid #C41E3A", maxWidth: "420px", margin: "0 auto", background: "#000", color: "#fff", fontFamily: "'Montserrat', sans-serif" }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: 24, fontWeight: 900, letterSpacing: "0.15em" }}>
                  RAVE<span style={{ color: "#C41E3A" }}>INK</span>
                </div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 4 }}>
                  DÖVME &amp; PIERCING STÜDYOSU
                </div>
              </div>
              <div style={{ fontSize: 11, borderBottom: "1px dashed rgba(255,255,255,0.2)", paddingBottom: 10, marginBottom: 10 }}>
                <div><strong>Fatura No:</strong> #{printReceipt.id.substring(0, 8).toUpperCase()}</div>
                <div><strong>Tarih:</strong> {printReceipt.date} · {printReceipt.time}</div>
              </div>
              <div style={{ fontSize: 11, marginBottom: 15 }}>
                <div style={{ fontWeight: 600, color: "#C41E3A", marginBottom: 4 }}>MÜŞTERİ BİLGİLERİ</div>
                <div>{printReceipt.customers?.name}</div>
                <div>{printReceipt.customers?.phone}</div>
              </div>
              <div style={{ fontSize: 11, marginBottom: 15 }}>
                <div style={{ fontWeight: 600, color: "#C41E3A", marginBottom: 4 }}>SEANS DETAYLARI</div>
                <div>Hizmet: {printReceipt.service}</div>
                <div>Sanatçı: {printReceipt.artists?.name}</div>
              </div>
              <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", borderBottom: "1px dashed rgba(255,255,255,0.2)", padding: "10px 0", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
                <span>TOPLAM TUTAR</span>
                <span style={{ color: "#4ade80" }}>₺{Number(printReceipt.price).toLocaleString("tr-TR")}</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: "2rem" }}>
                Bizi tercih ettiğiniz için teşekkür ederiz.<br />raveinktattoostudio.com
              </div>
            </div>
          </div>
        </>
      )}

      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          Kasa &amp; Finansal Takip
        </span>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={14} /> Yeni Gelir / Gider Ekle
        </button>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button 
        className="btn btn-primary no-print mobile-fab" 
        onClick={handleOpenNew}
        style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "25px",
          display: "none",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(196,30,58,0.4)",
          zIndex: 40,
        }}
      >
        <Plus size={24} />
      </button>

      <div className="erp-content no-print">
        {/* Row 1: Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div style={{ padding: 6, background: "rgba(74,222,128,0.06)", borderRadius: 2 }}><ArrowUpRight size={18} style={{ color: "#4ade80" }} /></div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#4ade80", fontFamily: "Cinzel, serif" }}>
              ₺{stats.income.toLocaleString("tr-TR")}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>
              Toplam Ciro (Gelir)
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div style={{ padding: 6, background: "rgba(196,30,58,0.06)", borderRadius: 2 }}><ArrowDownRight size={18} style={{ color: "#C41E3A" }} /></div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#C41E3A", fontFamily: "Cinzel, serif" }}>
              ₺{stats.expense.toLocaleString("tr-TR")}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>
              Toplam Giderler
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: "3px solid #4ade80" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div style={{ padding: 6, background: "rgba(255,255,255,0.03)", borderRadius: 2 }}><TrendingUp size={18} style={{ color: "#fff" }} /></div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "Cinzel, serif" }}>
              ₺{stats.profit.toLocaleString("tr-TR")}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>
              Net Kar / Zarar
            </div>
          </div>

          {/* Cash breakdown */}
          <div className="stat-card">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>💵 Nakit Kasa:</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>₺{stats.cash.toLocaleString("tr-TR")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>💳 Banka Kartı:</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>₺{stats.card.toLocaleString("tr-TR")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>🏦 Havale/EFT:</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>₺{stats.transfer.toLocaleString("tr-TR")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Graph & List */}
        <div className="grid-dashboard-main">

          {/* Grafikler */}
          <div className="card">
            <h3 className="section-title" style={{ fontSize: 13, marginBottom: "1.25rem" }}>Gelir &amp; Gider Karşılaştırması (Son 6 Ay)</h3>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(196,30,58,0.2)", borderRadius: 2 }} labelStyle={{ color: "#fff", fontWeight: 700 }} />
                  <Bar dataKey="Gelir" fill="#4ade80" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Gider" fill="#C41E3A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* İşlem Listesi */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="section-title" style={{ fontSize: 13 }}>Son Finansal İşlemler</h3>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <Loader2 size={24} className="animate-spin text-[#C41E3A]" />
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: 12 }}>
                Finansal hareket bulunamadı.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", maxHeight: 360, overflowY: "auto" }}>
                {transactions.map(t => {
                  const Icon = PAYMENT_METHODS[t.payment_method]?.icon ?? Wallet;
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                        display: "flex", alignItems: "center", gap: 12,
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{
                          padding: 6, borderRadius: 2,
                          background: t.type === "income" ? "rgba(74,222,128,0.06)" : "rgba(196,30,58,0.06)",
                          color: t.type === "income" ? "#4ade80" : "#C41E3A",
                          flexShrink: 0
                        }}>
                          <Icon size={14} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {t.description || CATEGORY_LABELS[t.category]}
                            </span>
                            {t.appointment_id && (
                              <button
                                title="Makbuz Yazdır"
                                onClick={() => loadAndPrintReceipt(t.appointment_id!)}
                                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#C41E3A")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                              >
                                <Printer size={11} />
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            {t.date} · {CATEGORY_LABELS[t.category]}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: t.type === "income" ? "#4ade80" : "#C41E3A"
                        }}>
                          {t.type === "income" ? "+" : "-"}₺{Number(t.amount).toLocaleString("tr-TR")}
                        </div>
                        <button
                          onClick={() => setDeleteConfirm(t.id)}
                          style={{ background: "none", border: "none", color: "rgba(196,30,58,0.4)", cursor: "pointer", fontSize: 10, marginTop: 2 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#C41E3A")}
                          onMouseLeave={e => (e.currentTarget.style.color = "rgba(196,30,58,0.4)")}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CSS style to format print view */}
      <style jsx global>{`
        .print-only-receipt {
          display: none;
        }
        @media print {
          .print-only-receipt {
            display: block !important;
          }
          body * {
            visibility: hidden;
          }
          .print-only-receipt, .print-only-receipt * {
            visibility: visible;
          }
          .print-only-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
              <X size={18} />
            </button>

            <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>
              Yeni Gelir / Gider Ekle
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Type toggle */}
              <div>
                <label className="label">İşlem Türü</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => set("type", "income")}
                    className={`btn ${form.type === "income" ? "btn-primary" : "btn-ghost"}`}
                    style={{ flex: 1, borderColor: form.type === "income" ? "#4ade80" : "", background: form.type === "income" ? "#4ade80" : "", color: form.type === "income" ? "#000" : "" }}
                  >
                    Gelir (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => set("type", "expense")}
                    className={`btn ${form.type === "expense" ? "btn-primary" : "btn-ghost"}`}
                    style={{ flex: 1, borderColor: form.type === "expense" ? "#C41E3A" : "", background: form.type === "expense" ? "#C41E3A" : "", color: form.type === "expense" ? "#fff" : "" }}
                  >
                    Gider (-)
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Kategori</label>
                  <select className="input" style={{ cursor: "pointer" }} value={form.category} onChange={e => set("category", e.target.value)}>
                    {form.type === "income" ? (
                      <>
                        <option value="session" style={{ background: "#111" }}>Seans Geliri</option>
                        <option value="other" style={{ background: "#111" }}>Diğer Gelir</option>
                      </>
                    ) : (
                      <>
                        <option value="material" style={{ background: "#111" }}>Malzeme Gideri</option>
                        <option value="rent" style={{ background: "#111" }}>Kira Gideri</option>
                        <option value="salary" style={{ background: "#111" }}>Maaş/Hakediş</option>
                        <option value="other" style={{ background: "#111" }}>Diğer Gider</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="label">Ödeme Yöntemi</label>
                  <select className="input" style={{ cursor: "pointer" }} value={form.payment_method} onChange={e => set("payment_method", e.target.value)}>
                    <option value="cash" style={{ background: "#111" }}>Nakit</option>
                    <option value="card" style={{ background: "#111" }}>Banka/Kredi Kartı</option>
                    <option value="bank_transfer" style={{ background: "#111" }}>Havale/EFT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Tutar (₺)</label>
                  <input className="input" type="number" placeholder="1500" value={form.amount} onChange={e => set("amount", e.target.value)} required />
                </div>
                <div>
                  <label className="label">Tarih</label>
                  <input className="input" type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Açıklama</label>
                <input className="input" placeholder="Ödeme detayları..." value={form.description} onChange={e => set("description", e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-panel" style={{ maxWidth: 360, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <Trash2 size={28} style={{ color: "#C41E3A", margin: "0 auto 1rem" }} />
            <div style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Kayıt Silinsin mi?
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Bu finansal kaydı silmek istediğinize emin misiniz? Bu işlem kasa bakiyesini etkileyecektir.
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className="btn btn-primary" style={{ flex: 1, background: "#8B0000", borderColor: "#8B0000" }} onClick={() => handleDelete(deleteConfirm)}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
