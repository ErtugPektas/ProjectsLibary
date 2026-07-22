import { useState, useEffect, useMemo } from "react";
import { InventoryItem } from "@/core/types";
import { SupabaseInventoryRepository } from "@/infrastructure/repositories/SupabaseInventoryRepository";

const inventoryRepo = new SupabaseInventoryRepository();

const EMPTY_FORM = {
  name: "",
  quantity: "",
  unit: "Adet",
  min_threshold: "5",
  category: "diğer",
  notes: "",
};

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryRepo.getAll();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const critical = items.filter(i => Number(i.quantity) <= Number(i.min_threshold)).length;
    return { total, critical };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === "all" || i.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [items, search, filterCategory]);

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (i: InventoryItem) => {
    setEditing(i);
    setForm({
      name: i.name,
      quantity: String(i.quantity),
      unit: i.unit,
      min_threshold: String(i.min_threshold),
      category: i.category,
      notes: i.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      min_threshold: Number(form.min_threshold),
      category: form.category,
      notes: form.notes || null,
    };

    try {
      if (editing) {
        await inventoryRepo.update(editing.id, payload);
      } else {
        await inventoryRepo.create(payload);
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
    const success = await inventoryRepo.delete(id);
    if (success) {
      setDeleteConfirm(null);
      await loadData();
    } else {
      alert("Hata: Malzeme silinemedi.");
    }
  };

  const adjustQuantity = async (item: InventoryItem, amount: number) => {
    const newQty = Math.max(0, item.quantity + amount);
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));

    try {
      await inventoryRepo.update(item.id, { ...item, quantity: newQty });
    } catch (err: any) {
      alert("Miktar güncellenemedi: " + err.message);
      await loadData(); // Revert
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return {
    items,
    loading,
    saving,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    showModal,
    setShowModal,
    editing,
    setEditing,
    form,
    setForm,
    deleteConfirm,
    setDeleteConfirm,
    stats,
    filteredItems,
    handleOpenNew,
    handleOpenEdit,
    handleSave,
    handleDelete,
    adjustQuantity,
    set,
  };
}
