import { useState, useEffect, useMemo } from "react";
import { DbAppointment } from "@/core/types";
import { SupabaseAppointmentRepository } from "@/infrastructure/repositories/SupabaseAppointmentRepository";
import { SupabaseArtistRepository } from "@/infrastructure/repositories/SupabaseArtistRepository";

const appointmentRepo = new SupabaseAppointmentRepository();
const artistRepo = new SupabaseArtistRepository();

export function useDashboard() {
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistsCount, setArtistsCount] = useState(0);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split("T")[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const appts = await appointmentRepo.getAll();
      const arts = await artistRepo.getAll();
      // Filter out appointments where the customer is archived
      const activeAppts = appts.filter(a => !a.customers?.archived);
      setAppointments(activeAppts);
      setArtistsCount(arts.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayAppts = useMemo(
    () => appointments.filter(a => a.date === today),
    [appointments, today]
  );

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    let startDayIdx = firstDay.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6; // Sunday is 6
    
    for (let i = 0; i < startDayIdx; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getSlotStatus = (dateStr: string, slotTime: string) => {
    const slotHour = parseInt(slotTime.split(":")[0]);
    const slotMin = parseInt(slotTime.split(":")[1]);
    
    const match = appointments.find(appt => {
      if (appt.date !== dateStr) return false;
      if (appt.status === "cancelled") return false;
      
      const apptHour = parseInt(appt.time.split(":")[0]);
      const apptMin = parseInt(appt.time.split(":")[1]);
      
      const apptTimeMinutes = apptHour * 60 + apptMin;
      const apptEndMinutes = apptTimeMinutes + (appt.duration || 120);
      
      const slotTimeMinutes = slotHour * 60 + slotMin;
      
      return slotTimeMinutes >= apptTimeMinutes && slotTimeMinutes < apptEndMinutes;
    });
    
    return match || null;
  };

  const stats = useMemo(() => {
    let income = 0;
    let pending = 0;
    let completed = 0;
    
    appointments.forEach(a => {
      if (a.status === "done") {
        completed += 1;
        income += Number(a.price);
      } else if (a.status === "pending") {
        pending += 1;
      } else if (a.status === "confirmed") {
        completed += 1; // Count confirmed sessions as active/completed in simple dashboard counter
      }
    });

    return { income, pending, completed };
  }, [appointments]);

  const selectedDateAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDateStr);
  }, [appointments, selectedDateStr]);

  const todayRevenue = useMemo(
    () => todayAppts.filter(a => a.status === "done").reduce((s, a) => s + Number(a.price), 0),
    [todayAppts]
  );

  const confirmedToday = useMemo(
    () => todayAppts.filter(a => a.status === "confirmed").length,
    [todayAppts]
  );

  const pendingToday = useMemo(
    () => todayAppts.filter(a => a.status === "pending").length,
    [todayAppts]
  );

  const recent = useMemo(() => appointments.slice(0, 5), [appointments]);

  return {
    appointments,
    loading,
    artistsCount,
    currentMonth,
    setCurrentMonth,
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
    loadData,
  };
}
