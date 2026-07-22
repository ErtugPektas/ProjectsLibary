import { supabase } from "@/lib/supabase";
import { TransactionRepository } from "../../core/repositories/TransactionRepository";
import { Transaction, AppointmentReceipt } from "../../core/types";

export class SupabaseTransactionRepository implements TransactionRepository {
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id, type, category, payment_method, amount, description, date, created_at, appointment_id,
        appointments (
          customers (
            name
          )
        )
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      throw new Error(error.message);
    }

    return (data as unknown as Transaction[]) || [];
  }

  async create(tx: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        type: tx.type,
        category: tx.category,
        payment_method: tx.payment_method,
        amount: Number(tx.amount),
        description: tx.description || null,
        date: tx.date,
        appointment_id: tx.appointment_id || null,
      })
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error creating transaction:", error);
      throw new Error(error?.message || "Transaction could not be created");
    }

    return data[0] as unknown as Transaction;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }

    return true;
  }

  async getReceipt(appointmentId: string): Promise<AppointmentReceipt | null> {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, service, date, time, price,
        customers ( name, phone, email ),
        artists ( name )
      `)
      .eq("id", appointmentId)
      .single();

    if (error) {
      console.error("Error fetching receipt:", error);
      return null;
    }

    return data as unknown as AppointmentReceipt;
  }
}
