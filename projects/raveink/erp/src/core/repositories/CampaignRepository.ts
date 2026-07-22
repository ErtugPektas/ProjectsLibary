import { Campaign } from "../types";

export interface CampaignRepository {
  getAll(): Promise<Campaign[]>;
  create(campaign: Partial<Campaign>): Promise<Campaign>;
  update(id: string, campaign: Partial<Campaign>): Promise<Campaign>;
  delete(id: string): Promise<boolean>;
}
