import { supabase } from "@/lib/supabase";
import { AppointmentRepository } from "../../core/repositories/AppointmentRepository";
import { DbAppointment, AppointmentStatus } from "../../core/types";

export class SupabaseAppointmentRepository implements AppointmentRepository {
  async getAll(): Promise<DbAppointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, customer_id, artist_id, service, date, time, duration, price, status, notes,
        customers (name, phone, archived),
        artists (name, color)
      `)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      throw new Error(error.message);
    }

    return (data as unknown as DbAppointment[]) || [];
  }

  async create(appointment: Partial<DbAppointment>): Promise<DbAppointment> {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        customer_id: appointment.customer_id,
        artist_id: appointment.artist_id,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time,
        duration: Number(appointment.duration),
        price: Number(appointment.price),
        notes: appointment.notes || null,
        status: appointment.status || "pending",
      })
      .select(`
        id, customer_id, artist_id, service, date, time, duration, price, status, notes,
        customers (name, phone, archived),
        artists (name, color)
      `);

    if (error || !data || data.length === 0) {
      console.error("Error creating appointment:", error);
      throw new Error(error?.message || "Appointment could not be created");
    }

    return data[0] as unknown as DbAppointment;
  }

  async update(id: string, appointment: Partial<DbAppointment>): Promise<DbAppointment> {
    const updatePayload: any = {};
    if (appointment.artist_id !== undefined) updatePayload.artist_id = appointment.artist_id;
    if (appointment.service !== undefined) updatePayload.service = appointment.service;
    if (appointment.date !== undefined) updatePayload.date = appointment.date;
    if (appointment.time !== undefined) updatePayload.time = appointment.time;
    if (appointment.duration !== undefined) updatePayload.duration = Number(appointment.duration);
    if (appointment.price !== undefined) updatePayload.price = Number(appointment.price);
    if (appointment.notes !== undefined) updatePayload.notes = appointment.notes;
    if (appointment.status !== undefined) updatePayload.status = appointment.status;

    const { data, error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", id)
      .select(`
        id, customer_id, artist_id, service, date, time, duration, price, status, notes,
        customers (name, phone, archived),
        artists (name, color)
      `);

    if (error || !data || data.length === 0) {
      console.error("Error updating appointment:", error);
      throw new Error(error?.message || "Appointment could not be updated");
    }

    return data[0] as unknown as DbAppointment;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting appointment:", error);
      return false;
    }

    return true;
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<boolean> {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating appointment status:", error);
      return false;
    }

    return true;
  }
}
