import { Artist, DbAppointment } from "../types";

export interface ArtistRepository {
  getAll(): Promise<Artist[]>;
  create(artist: Partial<Artist>): Promise<Artist>;
  update(id: string, artist: Partial<Artist>): Promise<Artist>;
  delete(id: string): Promise<boolean>;
  getAppointments(): Promise<DbAppointment[]>;
}
