import { supabase } from "@/lib/supabase";
import { InventoryRepository } from "../../core/repositories/InventoryRepository";
import { InventoryItem } from "../../core/types";

export class SupabaseInventoryRepository implements InventoryRepository {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching inventory:", error);
      throw new Error(error.message);
    }

    return (data as unknown as InventoryItem[]) || [];
  }

  async create(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from("inventory")
      .insert({
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        min_threshold: Number(item.min_threshold),
        category: item.category,
        notes: item.notes || null,
      })
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error creating inventory item:", error);
      throw new Error(error?.message || "Item could not be created");
    }

    return data[0] as unknown as InventoryItem;
  }

  async update(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    const payload: any = {};
    if (item.name !== undefined) payload.name = item.name;
    if (item.quantity !== undefined) payload.quantity = Number(item.quantity);
    if (item.unit !== undefined) payload.unit = item.unit;
    if (item.min_threshold !== undefined) payload.min_threshold = Number(item.min_threshold);
    if (item.category !== undefined) payload.category = item.category;
    if (item.notes !== undefined) payload.notes = item.notes || null;

    const { data, error } = await supabase
      .from("inventory")
      .update(payload)
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error updating inventory item:", error);
      throw new Error(error?.message || "Item could not be updated");
    }

    return data[0] as unknown as InventoryItem;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting inventory item:", error);
      return false;
    }

    return true;
  }
}
