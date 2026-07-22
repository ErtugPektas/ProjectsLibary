import { useState, useEffect } from "react";
import { Campaign, CampaignType } from "@/core/types";
import { SupabaseCampaignRepository } from "@/infrastructure/repositories/SupabaseCampaignRepository";

const campaignRepo = new SupabaseCampaignRepository();

const EMPTY_FORM = {
  type: "kampanya" as CampaignType,
  badge: "Kampanya",
  title: "",
  summary: "",
  detail: "",
  expiry: "",
  active: true,
  sort_order: 0,
};

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await campaignRepo.getAll();
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      type: c.type,
      badge: c.badge,
      title: c.title,
      summary: c.summary,
      detail: c.detail,
      expiry: c.expiry ?? "",
      active: c.active,
      sort_order: c.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      expiry: form.expiry || null,
      sort_order: Number(form.sort_order),
    };

    try {
      if (editing) {
        await campaignRepo.update(editing.id, payload);
      } else {
        await campaignRepo.create(payload);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Campaign) => {
    try {
      const updated = await campaignRepo.update(c.id, { active: !c.active });
      setCampaigns(prev => prev.map(x => x.id === c.id ? updated : x));
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await campaignRepo.delete(id);
      if (success) {
        setCampaigns(prev => prev.filter(x => x.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const set = (k: string, v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }));

  return {
    campaigns,
    loading,
    saving,
    showModal,
    setShowModal,
    editing,
    form,
    deleteConfirm,
    setDeleteConfirm,
    openNew,
    openEdit,
    handleSave,
    toggleActive,
    handleDelete,
    set,
  };
}
