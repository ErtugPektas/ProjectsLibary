import { supabase } from "@/lib/supabase";
import { ArtistRepository } from "../../core/repositories/ArtistRepository";
import { Artist, DbAppointment } from "../../core/types";

export class SupabaseArtistRepository implements ArtistRepository {
  async getAll(): Promise<Artist[]> {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching artists:", error);
      throw new Error(error.message);
    }

    return (data as unknown as Artist[]) || [];
  }

  async create(artist: Partial<Artist>): Promise<Artist> {
    const { data, error } = await supabase
      .from("artists")
      .insert({
        name: artist.name,
        specialty: artist.specialty || null,
        working_hours: artist.working_hours,
        color: artist.color,
      })
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error creating artist:", error);
      throw new Error(error?.message || "Artist could not be created");
    }

    return data[0] as unknown as Artist;
  }

  async update(id: string, artist: Partial<Artist>): Promise<Artist> {
    const { data, error } = await supabase
      .from("artists")
      .update({
        name: artist.name,
        specialty: artist.specialty || null,
        working_hours: artist.working_hours,
        color: artist.color,
      })
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error updating artist:", error);
      throw new Error(error?.message || "Artist could not be updated");
    }

    return data[0] as unknown as Artist;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("artists")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting artist:", error);
      return false;
    }

    return true;
  }

  async getAppointments(): Promise<DbAppointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, artist_id, price, status, date, service, time");

    if (error) {
      console.error("Error fetching appointments for artist stats:", error);
      throw new Error(error.message);
    }

    return (data as unknown as DbAppointment[]) || [];
  }
}
