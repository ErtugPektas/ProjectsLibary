import { supabase } from "@/lib/supabase";
import { CustomerRepository } from "../../core/repositories/CustomerRepository";
import { Customer, DbAppointment } from "../../core/types";

export class SupabaseCustomerRepository implements CustomerRepository {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching customers:", error);
      throw new Error(error.message);
    }

    return (data as unknown as Customer[]) || [];
  }

  async create(customer: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        birthdate: customer.birthdate || null,
        notes: customer.notes || null,
      })
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error creating customer:", error);
      throw new Error(error?.message || "Customer could not be created");
    }

    return data[0] as unknown as Customer;
  }

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        birthdate: customer.birthdate || null,
        notes: customer.notes || null,
      })
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error updating customer:", error);
      throw new Error(error?.message || "Customer could not be updated");
    }

    return data[0] as unknown as Customer;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting customer:", error);
      return false;
    }

    return true;
  }

  async toggleArchive(id: string, archived: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("customers")
      .update({ archived })
      .eq("id", id);

    if (error) {
      console.error("Error archiving customer:", error);
      return false;
    }

    return true;
  }

  async getAppointmentHistory(customerId: string): Promise<DbAppointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, service, date, time, price, status")
      .eq("customer_id", customerId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching appointment history:", error);
      throw new Error(error.message);
    }

    return (data as unknown as DbAppointment[]) || [];
  }
}
