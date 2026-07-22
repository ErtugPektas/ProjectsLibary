import { Customer, DbAppointment } from "../types";

export interface CustomerRepository {
  getAll(): Promise<Customer[]>;
  create(customer: Partial<Customer>): Promise<Customer>;
  update(id: string, customer: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<boolean>;
  toggleArchive(id: string, archived: boolean): Promise<boolean>;
  getAppointmentHistory(customerId: string): Promise<DbAppointment[]>;
}
