import { Transaction, AppointmentReceipt } from "../types";

export interface TransactionRepository {
  getAll(): Promise<Transaction[]>;
  create(tx: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<boolean>;
  getReceipt(appointmentId: string): Promise<AppointmentReceipt | null>;
}
