import { DbAppointment, AppointmentStatus } from "../types";

export interface AppointmentRepository {
  getAll(): Promise<DbAppointment[]>;
  create(appointment: Partial<DbAppointment>): Promise<DbAppointment>;
  update(id: string, appointment: Partial<DbAppointment>): Promise<DbAppointment>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: AppointmentStatus): Promise<boolean>;
}
