"use client";

import { useDashboard } from "@/presentation/hooks/useDashboard";
import { useAuth } from "@/lib/auth";
import { DbAppointment, AppointmentStatus } from "@/core/types";
import { CalendarDays, TrendingUp, Users, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";

const STATUS_ICONS: Record<AppointmentStatus, React.ElementType> = {
  pending: Clock,
  confirmed: AlertCircle,
  done: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "#facc15",
  confirmed: "#4ade80",
  done: "rgba(255,255,255,0.35)",
  cancelled: "#C41E3A",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  done: "Tamamlandı",
  cancelled: "İptal",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    appointments,
    loading,
    artistsCount,
    currentMonth,
    selectedDateStr,
    setSelectedDateStr,
    today,
    todayAppts,
    prevMonth,
    nextMonth,
    getDaysInMonth,
    getSlotStatus,
    stats,
    selectedDateAppointments,
    todayRevenue,
    confirmedToday,
    pendingToday,
    recent,
  } = useDashboard();

  const MONTHS_TR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  
  const DAYS_SHORT_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const WORKING_HOURS = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

  return (
    <>
      {/* Topbar */}
      <div className="erp-topbar" style={{ justifyContent: "space-between" }}>
        <div>
          <span style={{ fontFamily: "Cinzel, serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            Dashboard
          </span>
        </div>
        <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Hoş geldin, <span style={{ color: "#fff", fontWeight: 600 }}>{user?.name}</span>
        </div>
      </div>

      <div className="erp-content">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "#C41E3A" }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <StatCard
                icon={<CalendarDays size={20} style={{ color: "#C41E3A" }} />}
                label="Bugünkü Randevular"
                value={String(todayAppts.length)}
                sub={`${confirmedToday} onaylı · ${pendingToday} bekliyor`}
              />
              <StatCard
                icon={<TrendingUp size={20} style={{ color: "#4ade80" }} />}
                label="Günlük Gelir"
                value={`₺${todayRevenue.toLocaleString("tr-TR")}`}
                sub="Tamamlanan seanslar"
                accent="#4ade80"
              />
              <StatCard
                icon={<Users size={20} style={{ color: "#7c3aed" }} />}
                label="Aktif Sanatçılar"
                value={String(artistsCount)}
                sub="Kayıtlı dövme sanatçısı"
                accent="#7c3aed"
              />
              <StatCard
                icon={<CheckCircle size={20} style={{ color: "#facc15" }} />}
                label="Onay Bekliyor"
                value={String(pendingToday)}
                sub="Bugün işlem bekleyen"
                accent="#facc15"
              />
            </div>

            <div className="grid-dashboard-main">
              {/* Monthly Calendar View */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 className="section-title" style={{ fontSize: 14 }}>Aylık Randevu Takvimi</h2>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={prevMonth}>←</button>
                    <span style={{ fontFamily: "Cinzel, serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {MONTHS_TR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={nextMonth}>→</button>
                  </div>
                </div>

                {/* Days of week header */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", marginBottom: 6 }}>
                  {DAYS_SHORT_TR.map(d => (
                    <div key={d} style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{d}</div>
                  ))}
                </div>

                {/* Calendar days grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {getDaysInMonth(currentMonth).map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} style={{ background: "transparent" }} />;
                    
                    const dateStr = day.toISOString().split("T")[0];
                    const isSelected = dateStr === selectedDateStr;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    
                    const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== "cancelled");
                    
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDateStr(dateStr)}
                        style={{
                          background: isSelected ? "var(--btn-primary-bg)" : isToday ? "rgba(196,30,58,0.1)" : "rgba(255,255,255,0.02)",
                          border: isSelected ? "none" : isToday ? "1px solid #C41E3A" : "1px solid rgba(255,255,255,0.05)",
                          color: isSelected ? "var(--btn-primary-fg)" : "#fff",
                          padding: "8px 4px",
                          borderRadius: 2,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 45,
                          transition: "all 0.1s",
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{day.getDate()}</span>
                        {dayAppts.length > 0 && (
                          <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                            {dayAppts.slice(0, 3).map(a => (
                              <div key={a.id} style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "#fff" : a.artists?.color || "#C41E3A" }} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day's working hours schedule with slot blocking */}
              <div className="card">
                <h2 className="section-title" style={{ fontSize: 14, marginBottom: "1rem" }}>
                  {new Date(selectedDateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} Programı
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {WORKING_HOURS.map(slot => {
                    const appt = getSlotStatus(selectedDateStr, slot);
                    return (
                      <div 
                        key={slot} 
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 10px",
                          background: appt ? "rgba(196,30,58,0.04)" : "rgba(74,222,128,0.02)",
                          border: appt ? "1px solid rgba(196,30,58,0.15)" : "1px solid rgba(255,255,255,0.03)",
                          borderRadius: 2,
                          marginBottom: "0.25rem",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = appt ? "rgba(196,30,58,0.08)" : "rgba(74,222,128,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = appt ? "rgba(196,30,58,0.04)" : "rgba(74,222,128,0.02)"}
                        onClick={() => {
                          if (appt) {
                            window.location.href = `/appointments?id=${appt.id}`;
                          } else {
                            window.location.href = `/appointments?date=${selectedDateStr}&time=${slot}`;
                          }
                        }}
                      >
                        <div style={{ fontFamily: "Cinzel, serif", fontSize: 12, fontWeight: 700, color: appt ? "#C41E3A" : "#4ade80", width: 42 }}>
                          {slot}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {appt ? (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {appt.customers?.name || "Ayaküstü (Walk-in) Müşteri"}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {appt.artists?.name || "-"} · {appt.service} ({appt.duration} dk)
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                              Müsait / Boş (Randevu Yok)
                            </div>
                          )}
                        </div>
                        <div>
                          {appt ? (
                            <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(196,30,58,0.1)", color: "#C41E3A", borderRadius: 2, fontWeight: 700 }}>
                              KAPALI
                            </span>
                          ) : (
                            <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(74,222,128,0.1)", color: "#4ade80", borderRadius: 2, fontWeight: 700 }}>
                              AÇIK
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, label, value, sub, accent = "#C41E3A" }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ padding: "6px", background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "Cinzel, serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
        {sub}
      </div>
    </div>
  );
}
