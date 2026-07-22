"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, X, Phone, MessageCircle, ChevronLeft, ChevronRight, Loader2, Printer, Camera, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

import { DbAppointment, Artist, Customer, AppointmentStatus, ServiceType } from "@/core/types";
import { useAppointments } from "@/presentation/hooks/useAppointments";

const SERVICES: ServiceType[] = ["Dövme", "Piercing", "Dokunmatik", "Kapak", "Lazer", "Fine-line, Botanik", "Realism, Portrait"];
const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

const STATUS_BG: Record<AppointmentStatus, string> = {
  pending: "rgba(250,204,21,0.1)",
  confirmed: "rgba(74,222,128,0.1)",
  done: "rgba(255,255,255,0.04)",
  cancelled: "rgba(196,30,58,0.08)",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  done: "Tamamlandı",
  cancelled: "İptal",
};

export default function AppointmentsPage() {
  const {
    appointments,
    artists,
    customers,
    inventory,
    loading,
    saving,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterArtist,
    setFilterArtist,
    showModal,
    setShowModal,
    detailAppt,
    setDetailAppt,
    alarmBefore,
    setAlarmBefore,
    alarmStatus,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    editNotesText,
    setEditNotesText,
    editImage,
    setEditImage,
    parsedDetail,
    handleSetAlarm,
    updateStatus,
    handleDeleteAppointment,
    handleBulkDelete,
    handleSaveEdit,
    handleAddAppointment,
    loadData,
  } = useAppointments();

  const [view, setView] = useState<"list" | "week">("list");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeMaterials, setCompleteMaterials] = useState<Array<{ id: string; name: string; qty: number }>>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBulkDeleteSubmit = async () => {
    const confirmDelete = window.confirm(`Seçilen ${selectedIds.length} randevuyu silmek istediğinizden emin misiniz?`);
    if (!confirmDelete) return;

    const count = await handleBulkDelete(selectedIds);
    alert(`${count} randevu başarıyla silindi.`);
    setSelectedIds([]);
  };

  // Auto pre-fill materials based on appointment service on done transition
  useEffect(() => {
    if (showCompleteForm && detailAppt) {
      if (detailAppt.service === "Dövme") {
        const needle = inventory.find(i => i.category === "iğne" && i.quantity > 0);
        if (needle) {
          setCompleteMaterials([{ id: needle.id, name: needle.name, qty: 1 }]);
        } else {
          setCompleteMaterials([]);
        }
      } else if (detailAppt.service === "Piercing") {
        const jewelry = inventory.find(i => i.category === "takı" && i.quantity > 0);
        if (jewelry) {
          setCompleteMaterials([{ id: jewelry.id, name: jewelry.name, qty: 1 }]);
        } else {
          setCompleteMaterials([]);
        }
      } else {
        setCompleteMaterials([]);
      }
    } else {
      setCompleteMaterials([]);
    }
  }, [showCompleteForm, detailAppt, inventory]);

  const addCompleteMaterial = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    if (completeMaterials.some(ui => ui.id === itemId)) return;
    setCompleteMaterials(prev => [...prev, { id: item.id, name: item.name, qty: 1 }]);
  };

  const removeCompleteMaterial = (id: string) => {
    setCompleteMaterials(prev => prev.filter(ui => ui.id !== id));
  };

  const updateCompleteMaterialQty = (id: string, qty: number) => {
    setCompleteMaterials(prev => prev.map(ui => ui.id === id ? { ...ui, qty: Math.max(1, qty) } : ui));
  };

  // Automatically handle query parameters (?date=...&time=... or ?id=...) on page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const paramDate = sp.get("date");
      const paramTime = sp.get("time");
      const paramId = sp.get("id");

      if (paramDate && paramTime) {
        setShowModal(true);
      }
      if (paramId && appointments.length > 0) {
        const found = appointments.find(a => a.id === paramId);
        if (found) {
          setDetailAppt(found);
        }
      }
    }
  }, [appointments]);

  const handleCloseCreateModal = () => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/appointments");
    }
    setShowModal(false);
  };

  const handleCloseDetailModal = () => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/appointments");
    }
    setDetailAppt(null);
    setShowCompleteForm(false);
    setCompleteMaterials([]);
  };

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      // Filter out appointments where the customer is archived
      if (a.customers?.archived) return false;

      const matchSearch =
        (a.customers?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.customers?.phone || "").includes(search) ||
        (a.artists?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchArtist = filterArtist === "all" || a.artist_id === filterArtist;
      return matchSearch && matchStatus && matchArtist;
    });
  }, [appointments, search, filterStatus, filterArtist]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const waLink = (phone: string, name: string, date: string, time: string) => {
    const msg = encodeURIComponent(`Merhaba ${name}, ${date} tarihli ${time} randevunuzu hatırlatmak istedik. RaveInk Stüdyo 📍`);
    return `https://wa.me/9${phone.replace(/\D/g, "")}?text=${msg}`;
  };

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          Randevu Yönetimi
        </span>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Yeni Randevu
        </button>
      </div>

      <button 
        className="btn btn-primary no-print mobile-fab" 
        onClick={() => setShowModal(true)}
        style={{
          position: "fixed",
          bottom: "90px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "28px",
          display: "none",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 6px 20px rgba(196,30,58,0.5)",
          zIndex: 99,
          backgroundColor: "#C41E3A",
          border: "none",
          color: "#fff",
        }}
      >
        <Plus size={28} />
      </button>

      <div className="erp-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={28} className="animate-spin text-[#C41E3A]" />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Müşteri veya sanatçı ara..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                className="input"
                style={{ width: "auto", cursor: "pointer" }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as AppointmentStatus | "all")}
              >
                <option value="all">Tüm Durumlar</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>

              <select
                className="input"
                style={{ width: "auto", cursor: "pointer" }}
                value={filterArtist}
                onChange={e => setFilterArtist(e.target.value)}
              >
                <option value="all">Tüm Sanatçılar</option>
                {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                {(["list", "week"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      padding: "7px 14px",
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      background: view === v ? "#C41E3A" : "transparent",
                      color: view === v ? "#fff" : "rgba(255,255,255,0.4)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {v === "list" ? "Liste" : "Haftalık"}
                  </button>
                ))}
              </div>
            </div>

            {/* List View */}
            {view === "list" && (
              <>
                {selectedIds.length > 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    background: "rgba(196,30,58,0.95)",
                    border: "1px solid #C41E3A",
                    borderRadius: 2,
                    marginBottom: "1rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(4px)",
                    position: "sticky",
                    top: "1rem",
                    zIndex: 100
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      {selectedIds.length} randevu seçildi.
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ background: "#fff", color: "#C41E3A", border: "none", fontSize: 11, fontWeight: 700, padding: "6px 12px" }}
                        onClick={handleBulkDeleteSubmit}
                      >
                        Seçilenleri Sil
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 11, padding: "6px 12px" }}
                        onClick={() => setSelectedIds([])}
                      >
                        Seçimi Temizle
                      </button>
                    </div>
                  </div>
                )}

                {/* Desktop View Table */}
                <div className="hidden md:block card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: "center" }}>
                          <input 
                            type="checkbox" 
                            checked={filtered.length > 0 && selectedIds.length === filtered.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(filtered.map(a => a.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          />
                        </th>
                        <th>Müşteri</th>
                        <th>Sanatçı</th>
                        <th>Hizmet</th>
                        <th>Tarih</th>
                        <th>Saat</th>
                        <th>Ücret</th>
                        <th>Durum</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                            Randevu bulunamadı
                          </td>
                        </tr>
                      ) : (
                        filtered.map(a => (
                          <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => setDetailAppt(a)}>
                            <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={selectedIds.includes(a.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds(prev => [...prev, a.id]);
                                  } else {
                                    setSelectedIds(prev => prev.filter(id => id !== a.id));
                                  }
                                }}
                                style={{ cursor: "pointer" }}
                              />
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: "#fff", fontSize: 12 }}>{a.customers?.name || "Bilinmeyen Müşteri"}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.customers?.phone || "-"}</div>
                            </td>
                            <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.artists?.name || "-"}</td>
                            <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.service}</td>
                            <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                              {new Date(a.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                            </td>
                            <td style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{a.time}</td>
                            <td style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>₺{Number(a.price).toLocaleString("tr-TR")}</td>
                            <td>
                              <span
                                className={`badge badge-${a.status}`}
                                style={{ background: STATUS_BG[a.status], border: "none", display: "inline-block" }}
                              >
                                {STATUS_LABELS[a.status]}
                              </span>
                            </td>
                            <td onClick={e => e.stopPropagation()}>
                              {a.customers && (
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <a
                                    href={waLink(a.customers.phone, a.customers.name, new Date(a.date).toLocaleDateString("tr-TR"), a.time)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="WhatsApp"
                                    style={{ color: "#4ade80", display: "inline-flex", alignItems: "center" }}
                                  >
                                    <MessageCircle size={15} />
                                  </a>
                                  {a.status === "done" && (
                                    <a
                                      href={`/finance?print=${a.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Makbuz Yazdır"
                                      style={{ color: "rgba(255,255,255,0.45)", display: "inline-flex", alignItems: "center" }}
                                      onMouseEnter={e => (e.currentTarget.style.color = "#C41E3A")}
                                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                                    >
                                      <Printer size={15} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="block md:hidden" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {filtered.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                      Randevu bulunamadı
                    </div>
                  ) : (
                    filtered.map(a => (
                      <div
                        key={a.id}
                        className="card"
                        style={{
                          padding: "1rem",
                          borderLeft: `4px solid ${a.artists?.color || "var(--border)"}`,
                          cursor: "pointer"
                        }}
                        onClick={() => setDetailAppt(a)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(a.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(prev => [...prev, a.id]);
                                } else {
                                  setSelectedIds(prev => prev.filter(id => id !== a.id));
                                }
                              }}
                              onClick={e => e.stopPropagation()}
                              style={{ cursor: "pointer", width: 15, height: 15 }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{a.customers?.name || "Bilinmeyen Müşteri"}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.customers?.phone || "-"}</div>
                            </div>
                          </div>
                          <span
                            className={`badge badge-${a.status}`}
                            style={{ background: STATUS_BG[a.status], border: "none", fontSize: 10, padding: "2px 8px", display: "inline-block" }}
                          >
                            {STATUS_LABELS[a.status]}
                          </span>
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 10 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span>📅 {new Date(a.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}</span>
                            <span>🕒 {a.time}</span>
                            <span>🎨 {a.artists?.name || "-"}</span>
                          </div>
                          <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 12 }}>₺{Number(a.price).toLocaleString("tr-TR")}</div>
                        </div>

                        {a.customers && (
                          <div style={{ display: "flex", gap: 8, borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 10, paddingTop: 8 }} onClick={e => e.stopPropagation()}>
                            <a
                              href={waLink(a.customers.phone, a.customers.name, new Date(a.date).toLocaleDateString("tr-TR"), a.time)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost"
                              style={{ flex: 1, padding: "6px 8px", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 36 }}
                            >
                              <MessageCircle size={14} style={{ color: "#4ade80" }} /> Hatırlat
                            </a>
                            {a.status === "done" && (
                              <a
                                href={`/finance?print=${a.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost"
                                style={{ padding: "6px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 36 }}
                              >
                                <Printer size={14} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Week View */}
            {view === "week" && (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => setWeekStart(d => addDays(d, -7))}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontFamily: "Cinzel, serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {format(weekStart, "d MMMM", { locale: tr })} – {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: tr })}
                  </span>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => setWeekStart(d => addDays(d, 7))}>
                    <ChevronRight size={14} />
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: 10 }} onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                    Bu Hafta
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
                  {weekDays.map(day => {
                    const formattedDay = format(day, "yyyy-MM-dd");
                    const dayAppts = filtered.filter(a => a.date === formattedDay);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div 
                        key={day.toISOString()}
                        style={{
                          background: "rgba(255,255,255,0.01)",
                          borderRadius: 4,
                          padding: 6,
                          minHeight: 180,
                          cursor: "pointer",
                          transition: "background 0.15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.01)"}
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.history.replaceState({}, "", `/appointments?date=${formattedDay}&time=10:00`);
                          }
                          setShowModal(true);
                        }}
                      >
                        <div style={{
                          textAlign: "center",
                          padding: "6px 4px",
                          marginBottom: "0.25rem",
                          borderRadius: 2,
                          background: isToday ? "rgba(196,30,58,0.15)" : "transparent",
                          border: isToday ? "1px solid rgba(196,30,58,0.3)" : "1px solid transparent",
                        }}>
                          <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {format(day, "EEE", { locale: tr })}
                          </div>
                          <div style={{ fontFamily: "Cinzel, serif", fontSize: 18, fontWeight: 700, color: isToday ? "#C41E3A" : "#fff" }}>
                            {format(day, "d")}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {dayAppts.sort((a, b) => a.time.localeCompare(b.time)).map(a => (
                            <div
                              key={a.id}
                              onClick={e => {
                                e.stopPropagation();
                                setDetailAppt(a);
                              }}
                              style={{
                                padding: "5px 7px",
                                borderRadius: 2,
                                background: STATUS_BG[a.status],
                                borderLeft: `2px solid ${a.artists?.color || "#fff"}`,
                                cursor: "pointer",
                                fontSize: 10,
                              }}
                            >
                              <div style={{ fontWeight: 700, color: "#fff" }}>{a.time}</div>
                              <div style={{ color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {a.customers?.name || "Bilinmeyen"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <NewAppointmentModal
          customers={customers}
          artists={artists}
          inventory={inventory}
          onClose={handleCloseCreateModal}
          onAdd={handleAddAppointment}
          saving={saving}
          appointments={appointments}
        />
      )}

      {/* Detail Modal */}
      {detailAppt && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseDetailModal} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
              <X size={18} />
            </button>

            <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
              {detailAppt.customers?.name || "Bilinmeyen Müşteri"}
            </div>

            {isEditing ? (
              <form onSubmit={e => { e.preventDefault(); handleSaveEdit(); }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="label">Sanatçı</label>
                    <select
                      className="input"
                      value={editForm.artist_id || ""}
                      onChange={e => setEditForm(f => ({ ...f, artist_id: e.target.value }))}
                      required
                    >
                      {artists.map(a => <option key={a.id} value={a.id} style={{ background: "#111" }}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Hizmet</label>
                    <select
                      className="input"
                      value={editForm.service || ""}
                      onChange={e => setEditForm(f => ({ ...f, service: e.target.value as ServiceType }))}
                      required
                    >
                      {SERVICES.map(s => <option key={s} value={s} style={{ background: "#111" }}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="label">Tarih</label>
                    <input
                      className="input"
                      type="date"
                      value={editForm.date || ""}
                      onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Saat</label>
                    <input
                      className="input"
                      type="time"
                      value={editForm.time || ""}
                      onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label className="label">Süre (Dk)</label>
                    <input
                      className="input"
                      type="number"
                      value={editForm.duration || 0}
                      onChange={e => setEditForm(f => ({ ...f, duration: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Ücret (₺)</label>
                    <input
                      className="input"
                      type="number"
                      value={editForm.price || 0}
                      onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Notlar</label>
                  <textarea
                    className="input"
                    style={{ minHeight: 60, resize: "vertical" }}
                    value={editNotesText}
                    onChange={e => setEditNotesText(e.target.value)}
                  />
                </div>

                {/* Dövme Görseli Ekleme / Düzenleme */}
                <div style={{ marginBottom: "0.5rem" }}>
                  <label className="label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Dövme Görseli (İsteğe Bağlı)</span>
                    {editImage && (
                      <button type="button" onClick={() => setEditImage("")} style={{ color: "#C41E3A", fontSize: 10, background: "none", border: "none", cursor: "pointer" }}>
                        Kaldır
                      </button>
                    )}
                  </label>
                  {editImage ? (
                    <div style={{ position: "relative", width: 70, height: 70, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, background: "rgba(255,255,255,0.02)" }}>
                      <img src={editImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <label 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "10px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.15)",
                        borderRadius: 2,
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: 12,
                        textAlign: "center",
                        transition: "all 0.15s"
                      }}
                    >
                      <Camera size={15} /> Görsel Seç / Fotoğraf Çek
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                let w = img.width;
                                let h = img.height;
                                const max_size = 800;
                                if (w > h) {
                                  if (w > max_size) {
                                    h *= max_size / w;
                                    w = max_size;
                                  }
                                } else {
                                  if (h > max_size) {
                                    w *= max_size / h;
                                    h = max_size;
                                  }
                                }
                                canvas.width = w;
                                canvas.height = h;
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, w, h);
                                  setEditImage(canvas.toDataURL("image/jpeg", 0.7));
                                }
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                        style={{ display: "none" }} 
                      />
                    </label>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>
                    Vazgeç
                  </button>
                </div>
              </form>
            ) : showCompleteForm ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ padding: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    📦 SEANSTA KULLANILAN MALZEMELER (İSTEĞE BAĞLI)
                  </div>
                  
                  {completeMaterials.length === 0 ? (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Kullanılan malzeme seçilmedi.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      {completeMaterials.map(ui => (
                        <div key={ui.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "#fff", flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {ui.name}
                          </span>
                          <input
                            type="number"
                            className="input"
                            style={{ width: 60, padding: "4px 6px", fontSize: 11, textAlign: "center" }}
                            value={ui.qty}
                            onChange={e => updateCompleteMaterialQty(ui.id, Number(e.target.value))}
                          />
                          <button
                            type="button"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}
                            onClick={() => removeCompleteMaterial(ui.id)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <select
                      className="input"
                      style={{ padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          addCompleteMaterial(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="" disabled style={{ background: "#111" }}>+ Malzeme Ekle...</option>
                      {inventory
                        .filter(item => item.quantity > 0 && !completeMaterials.some(ui => ui.id === item.id))
                        .map(item => (
                          <option key={item.id} value={item.id} style={{ background: "#111" }}>
                            {item.name} (Mevcut: {item.quantity})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, backgroundColor: "#C41E3A", borderColor: "#C41E3A" }}
                    onClick={async () => {
                      await updateStatus(detailAppt.id, "done", completeMaterials);
                      setShowCompleteForm(false);
                      setCompleteMaterials([]);
                    }}
                  >
                    Malzemeleri Kaydet ve Tamamla
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1 }}
                    onClick={async () => {
                      await updateStatus(detailAppt.id, "done", []);
                      setShowCompleteForm(false);
                      setCompleteMaterials([]);
                    }}
                  >
                    Malzemesiz Tamamla
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1, borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                    onClick={() => {
                      setShowCompleteForm(false);
                      setCompleteMaterials([]);
                    }}
                  >
                    Vazgeç / Geri Dön
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  {[
                    ["Telefon", detailAppt.customers?.phone || "-"],
                    ["Sanatçı", detailAppt.artists?.name || "-"],
                    ["Hizmet", detailAppt.service],
                    ["Tarih", new Date(detailAppt.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })],
                    ["Saat", detailAppt.time],
                    ["Süre", `${detailAppt.duration} dk`],
                    ["Ücret", `₺${Number(detailAppt.price).toLocaleString("tr-TR")}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 2 }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {parsedDetail.notes && (
                  <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 2, marginBottom: "1rem" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Notlar</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{parsedDetail.notes}</div>
                  </div>
                )}

                {parsedDetail.image && (
                  <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 2, marginBottom: "1rem" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>DÖVME TASARIM RESMİ</div>
                    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", maxWidth: "200px" }}>
                      <img src={parsedDetail.image} style={{ width: "100%", height: "auto", display: "block" }} />
                    </div>
                  </div>
                )}

                {parsedDetail.usedItems && parsedDetail.usedItems.length > 0 && (
                  <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 2, marginBottom: "1rem" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>📦 KULLANILAN MALZEMELER</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {parsedDetail.usedItems.map((ui: any) => (
                        <div key={ui.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                          <span>{ui.name}</span>
                          <span style={{ fontWeight: 600 }}>{ui.qty} adet</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alarm Kur Section */}
                <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 2, marginBottom: "1rem" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>⏰ YÖNETİCİ HATIRLATMA ALARMI</div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <select
                      className="input"
                      style={{ flex: 1, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}
                      value={alarmBefore}
                      onChange={e => setAlarmBefore(Number(e.target.value))}
                    >
                      <option value={0}>Alarm Yok</option>
                      <option value={15}>15 Dakika Önce</option>
                      <option value={60}>1 Saat Önce</option>
                      <option value={120}>2 Saat Önce</option>
                      <option value={1440}>1 Gün Önce</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "8px 12px", fontSize: 11 }}
                      onClick={handleSetAlarm}
                    >
                      Kur
                    </button>
                  </div>
                  {alarmStatus && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontWeight: 500 }}>
                      {alarmStatus}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {detailAppt.customers && (
                    <a
                      href={waLink(detailAppt.customers.phone, detailAppt.customers.name, new Date(detailAppt.date).toLocaleDateString("tr-TR"), detailAppt.time)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ flex: 1, textDecoration: "none" }}
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Düzenle
                  </button>
                  <div style={{ display: "flex", gap: "0.5rem", flex: "1 1 100%", flexWrap: "wrap", marginTop: 4 }}>
                    {detailAppt.status === "pending" && (
                      <button className="btn btn-primary" style={{ flex: 1, backgroundColor: "#4ade80", borderColor: "#4ade80", color: "#000" }} onClick={() => updateStatus(detailAppt.id, "confirmed")}>
                        ✓ Randevuyu Onayla
                      </button>
                    )}
                    {detailAppt.status === "confirmed" && (
                      <button className="btn btn-primary" style={{ flex: 1, backgroundColor: "#C41E3A", borderColor: "#C41E3A" }} onClick={() => setShowCompleteForm(true)}>
                        ✓ Randevuyu Tamamla
                      </button>
                    )}
                    {detailAppt.status !== "cancelled" && detailAppt.status !== "done" && (
                      <button className="btn btn-ghost" style={{ flex: 1, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }} onClick={() => updateStatus(detailAppt.id, "cancelled")}>
                        ✗ İptal Et
                      </button>
                    )}
                    {detailAppt.status === "cancelled" && (
                      <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => updateStatus(detailAppt.id, "pending")}>
                        ↺ Randevuyu Geri Al (Bekleyen Yap)
                      </button>
                    )}
                    {detailAppt.status === "done" && (
                      <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => updateStatus(detailAppt.id, "confirmed")}>
                        ↺ Randevuyu Geri Al (Onaylandı Yap)
                      </button>
                    )}
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: "1 1 100%", color: "#C41E3A", borderColor: "rgba(196,30,58,0.2)", marginTop: 6 }}
                    onClick={() => {
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Sil / Arşivle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete/Archive custom confirm dialog */}
      {showDeleteConfirm && detailAppt && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-panel" style={{ maxWidth: 360, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <Trash2 size={28} style={{ color: "#C41E3A", margin: "0 auto 1rem" }} />
            <div style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Randevu / Müşteri İşlemi
            </div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Bu randevu ve müşteriyle ilgili ne yapmak istersiniz?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                className="btn btn-primary"
                style={{ background: "#C41E3A", borderColor: "#C41E3A" }}
                onClick={async () => {
                  if (detailAppt.customer_id) {
                    await supabase.from("customers").update({ archived: true }).eq("id", detailAppt.customer_id);
                    alert("Müşteri arşive gönderildi. Bu müşterinin randevuları artık aktif panellerde görünmeyecektir.");
                  }
                  setShowDeleteConfirm(false);
                  handleCloseDetailModal();
                  loadData(); // Reload appointments list
                }}
              >
                Müşteriyi Arşivle (Verileri Korur)
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "#8B0000", borderColor: "#8B0000" }}
                onClick={async () => {
                  await handleDeleteAppointment(detailAppt.id);
                  setShowDeleteConfirm(false);
                }}
              >
                Randevuyu Tamamen Sil
              </button>
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NewAppointmentModal({
  customers,
  artists,
  inventory,
  onClose,
  onAdd,
  saving,
  appointments
}: {
  customers: Customer[];
  artists: Artist[];
  inventory: Array<{ id: string; name: string; quantity: number; category: string }>;
  onClose: () => void;
  onAdd: (form: {
    customer_id: string;
    artist_id: string;
    service: ServiceType;
    date: string;
    time: string;
    duration: number;
    price: number;
    notes: string;
  }) => void;
  saving: boolean;
  appointments: DbAppointment[];
}) {
  const [customerMode, setCustomerMode] = useState<"registered" | "new" | "walkin">("registered");
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustLoading, setNewCustLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState("");
  const getInitialForm = () => {
    let dateVal = new Date().toISOString().split("T")[0];
    let timeVal = "10:00";
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("date")) dateVal = sp.get("date")!;
      if (sp.get("time")) timeVal = sp.get("time")!;
    }
    return {
      customer_id: customers[0]?.id || "",
      artist_id: artists[0]?.id || "",
      service: "Dövme" as ServiceType,
      date: dateVal,
      time: timeVal,
      duration: 120,
      price: 1500,
      notes: "",
      alarmBefore: 0,
    };
  };

  const [form, setForm] = useState(getInitialForm);

  useEffect(() => {
    if (!form.customer_id && customers.length > 0) {
      setForm(f => ({ ...f, customer_id: customers[0].id }));
    }
  }, [customers, form.customer_id]);

  useEffect(() => {
    if (!form.artist_id && artists.length > 0) {
      setForm(f => ({ ...f, artist_id: artists[0].id }));
    }
  }, [artists, form.artist_id]);

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            setImage(compressedBase64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };



  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    let customerIdToSave = "";

    if (customerMode === "walkin") {
      customerIdToSave = "cc0c209a-d066-4e9a-bffe-47c6e98f2cf9";
    } else if (customerMode === "new") {
      const isPiercing = (form.service as string) === "Piercing";
      if (!newCustName.trim() || (!isPiercing && !newCustPhone.trim())) {
        alert("Lütfen yeni müşteri adını girin.");
        setSubmitting(false);
        return;
      }
      setNewCustLoading(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            name: newCustName.trim(),
            phone: isPiercing ? "-" : newCustPhone.trim(),
            archived: false,
          })
          .select("id")
          .single();

        if (error || !data) {
          throw new Error(error?.message || "Müşteri oluşturulamadı.");
        }
        customerIdToSave = data.id;
      } catch (err: any) {
        alert("Yeni müşteri eklenirken hata oluştu: " + err.message);
        setNewCustLoading(false);
        setSubmitting(false);
        return;
      } finally {
        setNewCustLoading(false);
      }
    } else {
      customerIdToSave = form.customer_id;
    }

    if (!customerIdToSave) {
      alert("Lütfen bir müşteri seçin.");
      setSubmitting(false);
      return;
    }

    // Check for duplicate/conflict: same artist OR same customer on the same date and time (exclude walk-in)
    const hasConflict = appointments.some(a => 
      a.date === form.date && 
      a.time === form.time && 
      a.status !== "cancelled" &&
      (
        a.artist_id === form.artist_id || 
        (customerIdToSave !== "cc0c209a-d066-4e9a-bffe-47c6e98f2cf9" && a.customer_id === customerIdToSave)
      )
    );

    if (hasConflict) {
      const artistName = artists.find(art => art.id === form.artist_id)?.name || "Seçilen Sanatçı";
      const customerName = customers.find(c => c.id === customerIdToSave)?.name || "Seçilen Müşteri";
      const confirmProceed = window.confirm(
        `⚠️ UYARI: Bu tarih (${form.date}) ve saatte (${form.time}) ${artistName} veya ${customerName} için zaten aktif bir randevu bulunuyor.\n\nYine de çift randevu oluşturarak devam etmek istiyor musunuz?`
      );
      if (!confirmProceed) {
        setSubmitting(false);
        return;
      }
    }

    let finalNotes = form.notes;
    if (image) {
      finalNotes = `${finalNotes}||IMAGE:${image}||`;
    }
    if (form.alarmBefore > 0) {
      finalNotes = `${finalNotes}||ALARM:${form.alarmBefore}||`;
    }

    try {
      await onAdd({
        ...form,
        customer_id: customerIdToSave,
        notes: finalNotes,
      });
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
          <X size={18} />
        </button>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
          Yeni Randevu Oluştur
        </div>

        {/* Müşteri Tipi Seçici */}
        <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1rem", background: "rgba(255,255,255,0.03)", padding: 4, borderRadius: 2 }}>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: "6px 4px",
              fontSize: 10,
              background: customerMode === "registered" ? "var(--btn-primary-bg)" : "transparent",
              color: customerMode === "registered" ? "var(--btn-primary-fg)" : "rgba(255,255,255,0.5)",
              border: "none",
              whiteSpace: "nowrap",
            }}
            onClick={() => setCustomerMode("registered")}
          >
            👤 Kayıtlı
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: "6px 4px",
              fontSize: 10,
              background: customerMode === "new" ? "var(--btn-primary-bg)" : "transparent",
              color: customerMode === "new" ? "var(--btn-primary-fg)" : "rgba(255,255,255,0.5)",
              border: "none",
              whiteSpace: "nowrap",
            }}
            onClick={() => setCustomerMode("new")}
          >
            ➕ Yeni Müşteri
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: "6px 4px",
              fontSize: 10,
              background: customerMode === "walkin" ? "var(--btn-primary-bg)" : "transparent",
              color: customerMode === "walkin" ? "var(--btn-primary-fg)" : "rgba(255,255,255,0.5)",
              border: "none",
              whiteSpace: "nowrap",
            }}
            onClick={() => setCustomerMode("walkin")}
          >
            🚶 Walk-in
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {customerMode === "walkin" && (
            <div>
              <label className="label">Müşteri</label>
              <input className="input" type="text" value="Ayaküstü (Walk-in) Müşteri" disabled style={{ opacity: 0.6 }} />
            </div>
          )}

          {customerMode === "registered" && (
            <div>
              <label className="label">Müşteri Seçin</label>
              <select
                className="input"
                style={{ cursor: "pointer" }}
                value={form.customer_id}
                onChange={e => set("customer_id", e.target.value)}
                required
              >
                {customers
                  .filter(c => c.id !== "cc0c209a-d066-4e9a-bffe-47c6e98f2cf9")
                  .map(c => <option key={c.id} value={c.id} style={{ background: "#111" }}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
          )}

          {customerMode === "new" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", background: "rgba(255,255,255,0.01)", padding: 10, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C41E3A", textTransform: "uppercase" }}>Yeni Müşteri Bilgileri</div>
              <div>
                <label className="label">Ad Soyad</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Müşteri Adı Soyadı"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  required={customerMode === "new"}
                />
              </div>
              {(form.service as string) !== "Piercing" && (
                <div>
                  <label className="label">Telefon</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="0532 000 00 00"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    required={customerMode === "new" && (form.service as string) !== "Piercing"}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Sanatçı</label>
              <select className="input" style={{ cursor: "pointer" }} value={form.artist_id} onChange={e => set("artist_id", e.target.value)}>
                {artists.map(a => <option key={a.id} value={a.id} style={{ background: "#111" }}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Hizmet</label>
              <select className="input" style={{ cursor: "pointer" }} value={form.service} onChange={e => set("service", e.target.value)}>
                {SERVICES.map(s => <option key={s} value={s} style={{ background: "#111" }}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Tarih</label>
              <input className="input" type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
            </div>
            <div>
              <label className="label">Saat</label>
              <input className="input" type="time" value={form.time} onChange={e => set("time", e.target.value)} required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Süre (Dakika)</label>
              <input className="input" type="number" value={form.duration} onChange={e => set("duration", Number(e.target.value))} required />
            </div>
            <div>
              <label className="label">Ücret (₺)</label>
              <input className="input" type="number" value={form.price} onChange={e => set("price", Number(e.target.value))} required />
            </div>
          </div>

          <div>
            <label className="label">Hatırlatıcı (Alarm)</label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={form.alarmBefore}
              onChange={e => set("alarmBefore", Number(e.target.value))}
            >
              <option value={0} style={{ background: "#111" }}>Alarm Yok</option>
              <option value={15} style={{ background: "#111" }}>15 Dakika Önce</option>
              <option value={60} style={{ background: "#111" }}>1 Saat Önce</option>
              <option value={120} style={{ background: "#111" }}>2 Saat Önce</option>
              <option value={1440} style={{ background: "#111" }}>1 Gün Önce</option>
            </select>
          </div>

          {/* Dövme Görseli Ekleme */}
          <div>
            <label className="label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Dövme Görseli (İsteğe Bağlı)</span>
              {image && (
                <button type="button" onClick={() => setImage("")} style={{ color: "#C41E3A", fontSize: 10, background: "none", border: "none", cursor: "pointer" }}>
                  Kaldır
                </button>
              )}
            </label>
            {image ? (
              <div style={{ position: "relative", width: 70, height: 70, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, background: "rgba(255,255,255,0.02)" }}>
                <img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <label 
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  borderRadius: 2,
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 12,
                  textAlign: "center",
                  transition: "all 0.15s"
                }}
              >
                <Camera size={15} /> Görsel Seç / Fotoğraf Çek
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ display: "none" }} 
                />
              </label>
            )}
          </div>



          <div>
            <label className="label">Notlar / Seans Detayları</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Örn: Renkli tasarım, sol omuz çalışması..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>İptal</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving || submitting || newCustLoading}>
              {(saving || submitting) && <Loader2 size={13} className="animate-spin" />}
              Randevuyu Tamamla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
