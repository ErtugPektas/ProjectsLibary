import { useState, useEffect, useMemo } from "react";
import { Transaction, AppointmentReceipt } from "@/core/types";
import { SupabaseTransactionRepository } from "@/infrastructure/repositories/SupabaseTransactionRepository";

const transactionRepo = new SupabaseTransactionRepository();

const EMPTY_FORM = {
  type: "income" as "income" | "expense",
  category: "other",
  payment_method: "cash" as "cash" | "card" | "bank_transfer",
  amount: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [printReceipt, setPrintReceipt] = useState<AppointmentReceipt | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await transactionRepo.getAll();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAndPrintReceipt = async (apptId: string) => {
    try {
      const receipt = await transactionRepo.getReceipt(apptId);
      if (receipt) {
        setPrintReceipt(receipt);
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const printId = params.get("print");
      if (printId) {
        loadAndPrintReceipt(printId);
      }
    }
  }, []);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cash = 0;
    let card = 0;
    let transfer = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === "income") {
        income += amt;
        if (t.payment_method === "cash") cash += amt;
        else if (t.payment_method === "card") card += amt;
        else if (t.payment_method === "bank_transfer") transfer += amt;
      } else {
        expense += amt;
        if (t.payment_method === "cash") cash -= amt;
        else if (t.payment_method === "card") card -= amt;
        else if (t.payment_method === "bank_transfer") transfer -= amt;
      }
    });

    return {
      income,
      expense,
      profit: income - expense,
      cash,
      card,
      transfer,
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const monthly: Record<string, { month: string; Gelir: number; Gider: number }> = {};
    const monthsShort = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthly[key] = {
        month: `${monthsShort[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        Gelir: 0,
        Gider: 0,
      };
    }

    transactions.forEach(t => {
      const key = t.date.substring(0, 7); // YYYY-MM
      if (monthly[key]) {
        if (t.type === "income") {
          monthly[key].Gelir += Number(t.amount);
        } else {
          monthly[key].Gider += Number(t.amount);
        }
      }
    });

    return Object.values(monthly);
  }, [transactions]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      type: form.type,
      category: form.category,
      payment_method: form.payment_method,
      amount: Number(form.amount),
      description: form.description || null,
      date: form.date,
    };

    try {
      await transactionRepo.create(payload);
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
      const success = await transactionRepo.delete(id);
      if (success) {
        setDeleteConfirm(null);
        await loadData();
      }
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const handleOpenNew = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return {
    transactions,
    loading,
    saving,
    showModal,
    setShowModal,
    form,
    setForm,
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
  };
}
