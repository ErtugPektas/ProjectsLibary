import { useState, useEffect, useMemo } from "react";
import { DbAppointment, Artist, Customer, AppointmentStatus, ServiceType, InventoryItem } from "@/core/types";
import { SupabaseAppointmentRepository } from "@/infrastructure/repositories/SupabaseAppointmentRepository";
import { SupabaseArtistRepository } from "@/infrastructure/repositories/SupabaseArtistRepository";
import { SupabaseCustomerRepository } from "@/infrastructure/repositories/SupabaseCustomerRepository";
import { SupabaseInventoryRepository } from "@/infrastructure/repositories/SupabaseInventoryRepository";
import { SupabaseTransactionRepository } from "@/infrastructure/repositories/SupabaseTransactionRepository";
import { LocalNotifications } from "@capacitor/local-notifications";

const appointmentRepo = new SupabaseAppointmentRepository();
const artistRepo = new SupabaseArtistRepository();
const customerRepo = new SupabaseCustomerRepository();
const inventoryRepo = new SupabaseInventoryRepository();
const transactionRepo = new SupabaseTransactionRepository();

export const parseNotesMetadata = (notesStr: string | null) => {
  let notes = notesStr || "";
  let image = "";
  let usedItems: Array<{ id: string; name: string; qty: number }> = [];
  let alarmBefore = 0;

  if (notes.includes("||IMAGE:")) {
    const parts = notes.split("||IMAGE:");
    notes = parts[0];
    const right = parts[1] || "";
    if (right.includes("||")) {
      const subParts = right.split("||");
      image = subParts[0];
      const after = subParts.slice(1).join("||");
      if (after.includes("||USED_ITEMS:")) {
        const usedParts = after.split("||USED_ITEMS:");
        const usedJson = usedParts[1]?.split("||")[0] || "[]";
        try { usedItems = JSON.parse(usedJson); } catch (e) {}
      }
      if (after.includes("||ALARM:")) {
        const alarmParts = after.split("||ALARM:");
        alarmBefore = Number(alarmParts[1]?.split("||")[0] || "0");
      }
    } else {
      image = right;
    }
  }

  if (notes.includes("||USED_ITEMS:")) {
    const parts = notes.split("||USED_ITEMS:");
    if (!notesStr?.includes("||IMAGE:")) notes = parts[0];
    const usedJson = parts[1]?.split("||")[0] || "[]";
    try { usedItems = JSON.parse(usedJson); } catch (e) {}
    const after = parts[1] || "";
    if (after.includes("||ALARM:")) {
      const alarmParts = after.split("||ALARM:");
      alarmBefore = Number(alarmParts[1]?.split("||")[0] || "0");
    }
  }

  if (notes.includes("||ALARM:")) {
    const parts = notes.split("||ALARM:");
    if (!notesStr?.includes("||IMAGE:") && !notesStr?.includes("||USED_ITEMS:")) notes = parts[0];
    alarmBefore = Number(parts[1]?.split("||")[0] || "0");
  }

  return { notes: notes.trim(), image, usedItems, alarmBefore };
};

export const buildNotesMetadata = (notes: string, image: string, usedItems: any[], alarmBefore: number) => {
  let result = notes.trim();
  if (image) {
    result += `||IMAGE:${image}||`;
  }
  if (usedItems && usedItems.length > 0) {
    result += `||USED_ITEMS:${JSON.stringify(usedItems)}||`;
  }
  if (alarmBefore > 0) {
    result += `||ALARM:${alarmBefore}||`;
  }
  return result;
};

export function useAppointments() {
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterArtist, setFilterArtist] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [detailAppt, setDetailAppt] = useState<DbAppointment | null>(null);

  const [alarmBefore, setAlarmBefore] = useState(0);
  const [alarmStatus, setAlarmStatus] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DbAppointment>>({});
  const [editNotesText, setEditNotesText] = useState("");
  const [editImage, setEditImage] = useState("");

  const hashStringToInt = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  };

  useEffect(() => {
    if (detailAppt) {
      const parsed = parseNotesMetadata(detailAppt.notes);
      setAlarmBefore(parsed.alarmBefore);
      if (parsed.alarmBefore > 0) {
        setAlarmStatus(`⏰ Alarm aktif (${parsed.alarmBefore === 1440 ? "1 gün" : parsed.alarmBefore === 120 ? "2 saat" : parsed.alarmBefore === 60 ? "1 saat" : "15 dakika"} önce)`);
      } else {
        setAlarmStatus("");
      }
      setEditForm({ ...detailAppt });
      setIsEditing(false);
      setEditNotesText(parsed.notes);
      setEditImage(parsed.image);
    }
  }, [detailAppt]);

  const parsedDetail = useMemo(() => {
    if (!detailAppt) return { notes: "", image: "", usedItems: [], alarmBefore: 0 };
    return parseNotesMetadata(detailAppt.notes);
  }, [detailAppt]);

  const handleSetAlarm = async () => {
    if (!detailAppt) return;
    
    const notifId = hashStringToInt(detailAppt.id) % 1000000;
    const parsed = parseNotesMetadata(detailAppt.notes);

    if (alarmBefore === 0) {
      try {
        const updatedNotes = buildNotesMetadata(parsed.notes, parsed.image, parsed.usedItems, 0);
        await appointmentRepo.update(detailAppt.id, { notes: updatedNotes });
        
        setAppointments(prev => prev.map(a => a.id === detailAppt.id ? { ...a, notes: updatedNotes } : a));
        setDetailAppt(prev => prev ? { ...prev, notes: updatedNotes } : null);

        await LocalNotifications.cancel({
          notifications: [{ id: notifId }]
        });
        localStorage.removeItem(`alarm_${detailAppt.id}`);
        setAlarmStatus("⏰ Alarm iptal edildi");
      } catch (e: any) {
        setAlarmStatus("❌ Hata: " + e.message);
      }
      return;
    }

    const apptDate = new Date(`${detailAppt.date}T${detailAppt.time}`);
    const alarmTime = new Date(apptDate.getTime() - alarmBefore * 60000);

    if (alarmTime.getTime() < Date.now()) {
      setAlarmStatus("⚠️ Hata: Alarm zamanı geçmişte!");
      return;
    }

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") {
        setAlarmStatus("❌ Bildirim izni reddedildi!");
        return;
      }

      const updatedNotes = buildNotesMetadata(parsed.notes, parsed.image, parsed.usedItems, alarmBefore);
      await appointmentRepo.update(detailAppt.id, { notes: updatedNotes });

      setAppointments(prev => prev.map(a => a.id === detailAppt.id ? { ...a, notes: updatedNotes } : a));
      setDetailAppt(prev => prev ? { ...prev, notes: updatedNotes } : null);

      await LocalNotifications.cancel({
        notifications: [{ id: notifId }]
      });

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Randevu Hatırlatıcısı ⏰",
            body: `Müşteri: ${detailAppt.customers?.name || "Bilinmeyen"}, Sanatçı: ${detailAppt.artists?.name || "Bilinmeyen"}. Randevu saati yaklaşıyor! (${detailAppt.time})`,
            id: notifId,
            schedule: { at: alarmTime },
            sound: 'beep.wav',
          }
        ]
      });

      const timeStr = alarmTime.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });
      setAlarmStatus(`✅ Alarm kuruldu: ${timeStr} (${alarmTime.toLocaleDateString("tr-TR")})`);
      localStorage.setItem(`alarm_${detailAppt.id}`, String(alarmBefore));
    } catch (e: any) {
      setAlarmStatus("❌ Hata: " + e.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const appts = await appointmentRepo.getAll();
      setAppointments(appts);
    } catch (e) {
      console.error("Error loading appointments:", e);
    }

    try {
      const arts = await artistRepo.getAll();
      setArtists(arts);
    } catch (e) {
      console.error("Error loading artists:", e);
    }

    try {
      const custs = await customerRepo.getAll();
      setCustomers(custs);
    } catch (e) {
      console.error("Error loading customers:", e);
    }

    try {
      const inv = await inventoryRepo.getAll();
      setInventory(inv);
    } catch (e) {
      console.error("Error loading inventory:", e);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Synchronize scheduled notifications on the current device (cross-device/account alarm integration)
  useEffect(() => {
    if (appointments.length === 0) return;

    const syncAlarms = async () => {
      try {
        const isGranted = await LocalNotifications.checkPermissions();
        if (isGranted.display !== "granted") {
          await LocalNotifications.requestPermissions();
        }

        for (const appt of appointments) {
          const parsed = parseNotesMetadata(appt.notes);
          const notifId = hashStringToInt(appt.id) % 1000000;

          if (appt.status === "cancelled" || appt.status === "done" || parsed.alarmBefore === 0) {
            // Cancel notification if it was scheduled
            await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
            continue;
          }

          // Schedule or reschedule alarm in the future
          const apptDate = new Date(`${appt.date}T${appt.time}`);
          const alarmTime = new Date(apptDate.getTime() - parsed.alarmBefore * 60000);

          if (alarmTime.getTime() > Date.now()) {
            await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: "Randevu Hatırlatıcısı ⏰",
                  body: `Müşteri: ${appt.customers?.name || "Bilinmeyen"}, Sanatçı: ${appt.artists?.name || "Bilinmeyen"}. Randevu saati yaklaşıyor! (${appt.time})`,
                  id: notifId,
                  schedule: { at: alarmTime },
                  sound: 'beep.wav',
                }
              ]
            });
          } else {
            // Past alarm, cancel
            await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
          }
        }
      } catch (e) {
        console.error("Error syncing alarms:", e);
      }
    };

    syncAlarms();
  }, [appointments]);

  const updateStatus = async (id: string, status: AppointmentStatus, usedItems?: Array<{ id: string; name: string; qty: number }>) => {
    let updatedNotes: string | null = null;
    if (status === "done" && usedItems && usedItems.length > 0) {
      const appt = appointments.find(a => a.id === id);
      if (appt) {
        const parsed = parseNotesMetadata(appt.notes);
        updatedNotes = buildNotesMetadata(parsed.notes, parsed.image, usedItems, parsed.alarmBefore);
        try {
          await appointmentRepo.update(id, { notes: updatedNotes });
          for (const item of usedItems) {
            const currentItem = inventory.find(i => i.id === item.id);
            if (currentItem) {
              const newQty = Math.max(0, currentItem.quantity - item.qty);
              await inventoryRepo.update(item.id, { quantity: newQty });
            }
          }
          const inv = await inventoryRepo.getAll();
          setInventory(inv);
        } catch (e) {
          console.error("Error saving materials or updating inventory:", e);
        }
      }
    }

    const success = await appointmentRepo.updateStatus(id, status);
    if (success) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, notes: updatedNotes !== null ? updatedNotes : a.notes } : a));
      if (detailAppt?.id === id) setDetailAppt(prev => prev ? { ...prev, status, notes: updatedNotes !== null ? updatedNotes : prev.notes } : null);

      if (status === "done") {
        const appt = appointments.find(a => a.id === id);
        if (appt) {
          // Add income transaction
          await transactionRepo.create({
            type: "income",
            category: "session",
            payment_method: "cash",
            amount: Number(appt.price),
            description: `${appt.customers?.name || "Bilinmeyen Müşteri"} - ${appt.service} Seansı`,
            date: appt.date,
            appointment_id: id,
          });

          // Automatically archive the customer!
          if (appt.customer_id && appt.customer_id !== "cc0c209a-d066-4e9a-bffe-47c6e98f2cf9") {
            await customerRepo.toggleArchive(appt.customer_id, true);
            const updatedCusts = await customerRepo.getAll();
            setCustomers(updatedCusts);
            // Refresh list to filter out immediately in UI
            const appts = await appointmentRepo.getAll();
            setAppointments(appts);
          }
        }
      } else {
        // Reverted from done to active, make sure customer is un-archived
        const appt = appointments.find(a => a.id === id);
        if (appt && appt.customer_id && appt.customer_id !== "cc0c209a-d066-4e9a-bffe-47c6e98f2cf9") {
          await customerRepo.toggleArchive(appt.customer_id, false);
          const updatedCusts = await customerRepo.getAll();
          setCustomers(updatedCusts);
          const appts = await appointmentRepo.getAll();
          setAppointments(appts);
        }
      }
    } else {
      alert("Durum güncellenemedi.");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    const success = await appointmentRepo.delete(id);
    if (success) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      setDetailAppt(null);
    } else {
      alert("Randevu silinemedi.");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      let deletedIds: string[] = [];
      for (const id of ids) {
        const success = await appointmentRepo.delete(id);
        if (success) {
          deletedIds.push(id);
        }
      }
      if (deletedIds.length > 0) {
        setAppointments(prev => prev.filter(a => !deletedIds.includes(a.id)));
      }
      return deletedIds.length;
    } catch (e) {
      console.error("Bulk delete error:", e);
      return 0;
    }
  };

  const handleSaveEdit = async () => {
    if (!detailAppt || !editForm) return;
    
    let finalNotes = editNotesText;
    if (editImage) {
      finalNotes = `${finalNotes}||IMAGE:${editImage}||`;
    }
    if (parsedDetail.usedItems && parsedDetail.usedItems.length > 0) {
      finalNotes = `${finalNotes}||USED_ITEMS:${JSON.stringify(parsedDetail.usedItems)}||`;
    }

    setSaving(true);
    try {
      const updated = await appointmentRepo.update(detailAppt.id, {
        artist_id: editForm.artist_id,
        service: editForm.service,
        date: editForm.date,
        time: editForm.time,
        duration: Number(editForm.duration),
        price: Number(editForm.price),
        notes: finalNotes || null,
      });

       // Ensure the customer is active (un-archived) when saving edits on their appointment
      if (detailAppt.customer_id && detailAppt.customer_id !== "cc0c209a-d066-4e9a-bffe-47c6e98f2cf9") {
        await customerRepo.toggleArchive(detailAppt.customer_id, false);
        const updatedCusts = await customerRepo.getAll();
        setCustomers(updatedCusts);
      }

      setAppointments(prev => prev.map(a => a.id === detailAppt.id ? updated : a));
      setDetailAppt(updated);
      setIsEditing(false);
    } catch (e: any) {
      alert("Randevu güncellenemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAppointment = async (form: {
    customer_id: string;
    artist_id: string;
    service: ServiceType;
    date: string;
    time: string;
    duration: number;
    price: number;
    notes: string;
  }) => {
    setSaving(true);
    try {
      const newAppt = await appointmentRepo.create({
        customer_id: form.customer_id,
        artist_id: form.artist_id,
        service: form.service,
        date: form.date,
        time: form.time,
        duration: Number(form.duration),
        price: Number(form.price),
        notes: form.notes || null,
        status: "pending",
      });

      // Ensure the customer is active (un-archived) when a new appointment is scheduled
      if (form.customer_id && form.customer_id !== "cc0c209a-d066-4e9a-bffe-47c6e98f2cf9") {
        await customerRepo.toggleArchive(form.customer_id, false);
        const updatedCusts = await customerRepo.getAll();
        setCustomers(updatedCusts);
      }

      setAppointments(prev => [...prev, newAppt]);
      setShowModal(false);
    } catch (e: any) {
      alert("Randevu eklenemedi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return {
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
    setAlarmStatus,
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
  };
}
