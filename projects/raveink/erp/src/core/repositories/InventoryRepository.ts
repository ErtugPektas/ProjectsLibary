import { InventoryItem } from "../types";

export interface InventoryRepository {
  getAll(): Promise<InventoryItem[]>;
  create(item: Partial<InventoryItem>): Promise<InventoryItem>;
  update(id: string, item: Partial<InventoryItem>): Promise<InventoryItem>;
  delete(id: string): Promise<boolean>;
}
