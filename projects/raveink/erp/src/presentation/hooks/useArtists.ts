import { useState, useEffect, useMemo } from "react";
import { Artist, DbAppointment } from "@/core/types";
import { SupabaseArtistRepository } from "@/infrastructure/repositories/SupabaseArtistRepository";

const artistRepo = new SupabaseArtistRepository();

const EMPTY_FORM = {
  name: "",
  specialty: "",
  working_hours: "10:00 - 20:00",
  color: "#C41E3A",
};

export function useArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const artistsData = await artistRepo.getAll();
      const apptsData = await artistRepo.getAppointments();
      setArtists(artistsData);
      setAppointments(apptsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const artistStats = useMemo(() => {
    const stats: Record<string, { totalAppointments: number; completedCount: number; currentMonthRevenue: number }> = {};
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    artists.forEach(a => {
      stats[a.id] = { totalAppointments: 0, completedCount: 0, currentMonthRevenue: 0 };
    });

    appointments.forEach(appt => {
      if (!appt.artist_id || !stats[appt.artist_id]) return;

      stats[appt.artist_id].totalAppointments += 1;

      if (appt.status === "done") {
        stats[appt.artist_id].completedCount += 1;
      }

      if ((appt.status === "done" || appt.status === "confirmed") && appt.date.startsWith(currentMonth)) {
        stats[appt.artist_id].currentMonthRevenue += Number(appt.price);
      }
    });

    return stats;
  }, [artists, appointments]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (a: Artist, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(a);
    setForm({
      name: a.name,
      specialty: a.specialty ?? "",
      working_hours: a.working_hours,
      color: a.color,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      specialty: form.specialty || null,
      working_hours: form.working_hours,
      color: form.color,
    };

    try {
      if (editing) {
        const updated = await artistRepo.update(editing.id, payload);
        if (selectedArtist?.id === editing.id) {
          setSelectedArtist({ ...selectedArtist, ...updated });
        }
      } else {
        await artistRepo.create(payload);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await artistRepo.delete(id);
      if (success) {
        if (selectedArtist?.id === id) {
          setSelectedArtist(null);
        }
        setDeleteConfirm(null);
        await loadData();
      }
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return {
    artists,
    appointments,
    loading,
    saving,
    selectedArtist,
    setSelectedArtist,
    showModal,
    setShowModal,
    editing,
    setEditing,
    form,
    setForm,
    deleteConfirm,
    setDeleteConfirm,
    artistStats,
    handleOpenNew,
    handleOpenEdit,
    handleSave,
    handleDelete,
    set,
  };
}
