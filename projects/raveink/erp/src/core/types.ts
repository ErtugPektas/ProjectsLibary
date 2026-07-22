export type AppointmentStatus = "pending" | "confirmed" | "done" | "cancelled";

export type ServiceType = 
  | "Dövme" 
  | "Piercing" 
  | "Dokunmatik" 
  | "Kapak" 
  | "Lazer" 
  | "Fine-line, Botanik" 
  | "Realism, Portrait";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthdate: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
}

export interface Artist {
  id: string;
  name: string;
  color: string;
  specialty: string | null;
  working_hours: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  category: string;
  notes: string | null;
  created_at: string;
}

export interface DbAppointment {
  id: string;
  customer_id: string;
  artist_id: string;
  service: ServiceType;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  notes: string | null;
  customers?: Customer | null;
  artists?: Artist | null;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  payment_method: "cash" | "card" | "bank_transfer";
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  appointment_id: string | null;
  appointments?: {
    customers: {
      name: string;
    } | null;
  } | null;
}

export interface AppointmentReceipt {
  id: string;
  service: string;
  date: string;
  time: string;
  price: number;
  customers: { name: string; phone: string; email: string | null } | null;
  artists: { name: string } | null;
}

export type CampaignType = "kampanya" | "duyuru" | "etkinlik";

export interface Campaign {
  id: string;
  type: CampaignType;
  badge: string;
  title: string;
  summary: string;
  detail: string;
  expiry: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}
