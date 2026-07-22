import { supabase } from "@/lib/supabase";
import { CampaignRepository } from "../../core/repositories/CampaignRepository";
import { Campaign } from "../../core/types";

export class SupabaseCampaignRepository implements CampaignRepository {
  async getAll(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching campaigns:", error);
      throw new Error(error.message);
    }

    return (data as unknown as Campaign[]) || [];
  }

  async create(campaign: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        type: campaign.type,
        badge: campaign.badge,
        title: campaign.title,
        summary: campaign.summary,
        detail: campaign.detail,
        expiry: campaign.expiry || null,
        active: campaign.active,
        sort_order: Number(campaign.sort_order),
      })
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error creating campaign:", error);
      throw new Error(error?.message || "Campaign could not be created");
    }

    return data[0] as unknown as Campaign;
  }

  async update(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from("campaigns")
      .update({
        type: campaign.type,
        badge: campaign.badge,
        title: campaign.title,
        summary: campaign.summary,
        detail: campaign.detail,
        expiry: campaign.expiry || null,
        active: campaign.active,
        sort_order: Number(campaign.sort_order),
      })
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      console.error("Error updating campaign:", error);
      throw new Error(error?.message || "Campaign could not be updated");
    }

    return data[0] as unknown as Campaign;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting campaign:", error);
      return false;
    }

    return true;
  }
}
