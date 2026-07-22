import { useState, useEffect, useMemo } from "react";
import { Customer, DbAppointment } from "@/core/types";
import { SupabaseCustomerRepository } from "@/infrastructure/repositories/SupabaseCustomerRepository";

const customerRepo = new SupabaseCustomerRepository();

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  birthdate: "",
  notes: "",
  serviceType: "Dövme",
};

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<DbAppointment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerRepo.getAll();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Load appointment history when a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const history = await customerRepo.getAppointmentHistory(selectedCustomer.id);
          setCustomerHistory(history);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    } else {
      setCustomerHistory([]);
    }
  }, [selectedCustomer]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
      const matchTab = activeTab === "active" ? !c.archived : c.archived;
      return matchSearch && matchTab;
    });
  }, [customers, search, activeTab]);

  const stats = useMemo(() => {
    const totalVisits = customerHistory.length;
    const completedVisits = customerHistory.filter(a => a.status === "done");
    const totalSpent = completedVisits.reduce((sum, a) => sum + Number(a.price), 0);
    return { totalVisits, totalSpent };
  }, [customerHistory]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone === "-" ? "" : c.phone,
      email: c.email ?? "",
      birthdate: c.birthdate ?? "",
      notes: c.notes ?? "",
      serviceType: c.phone === "-" ? "Piercing" : "Dövme",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const isPiercing = form.serviceType === "Piercing";
    const payload = {
      name: form.name,
      phone: isPiercing ? "-" : form.phone,
      email: isPiercing ? null : (form.email || null),
      birthdate: isPiercing ? null : (form.birthdate || null),
      notes: form.notes || null,
    };

    if (!payload.name.trim() || (!isPiercing && !payload.phone.trim())) {
      alert("Lütfen geçerli bir isim ve telefon numarası girin.");
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        const updated = await customerRepo.update(editing.id, payload);
        if (selectedCustomer?.id === editing.id) {
          setSelectedCustomer({ ...selectedCustomer, ...updated });
        }
      } else {
        await customerRepo.create(payload);
      }
      setShowModal(false);
      await loadCustomers();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const newArchived = !c.archived;

    // Optimistic UI update
    setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, archived: newArchived } : x));
    if (selectedCustomer?.id === c.id) {
      setSelectedCustomer({ ...selectedCustomer, archived: newArchived });
    }

    try {
      const success = await customerRepo.toggleArchive(c.id, newArchived);
      if (!success) {
        alert("Arşivleme hatası");
        await loadCustomers();
      }
    } catch (err: any) {
      alert("Arşivleme hatası: " + err.message);
      await loadCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await customerRepo.delete(id);
    if (success) {
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      setDeleteConfirm(null);
      await loadCustomers();
    } else {
      alert("Hata: Müşteri silinemedi.");
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return {
    customers,
    loading,
    saving,
    search,
    setSearch,
    selectedCustomer,
    setSelectedCustomer,
    customerHistory,
    setCustomerHistory,
    loadingHistory,
    setLoadingHistory,
    activeTab,
    setActiveTab,
    showModal,
    setShowModal,
    editing,
    setEditing,
    form,
    setForm,
    deleteConfirm,
    setDeleteConfirm,
    filteredCustomers,
    stats,
    handleOpenNew,
    handleOpenEdit,
    handleSave,
    toggleArchive,
    handleDelete,
    set,
  };
}
