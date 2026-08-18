import api from "@/lib/api";
import type { Bonus } from "@/lib/types";

export interface ListBonusesParams {
  workerId?: string;
}

export interface CreateBonusPayload {
  workerId: string;
  amount: number;
  reason: string;
}

export const bonusesService = {
  getBonuses: async (params: ListBonusesParams = {}): Promise<Bonus[]> => {
    const { data } = await api.get<{ items: Bonus[] }>("/bonuses", { params });
    return data.items;
  },

  createBonuses: async (payload: CreateBonusPayload): Promise<Bonus> => {
    const { data } = await api.post<Bonus>("/bonuses", payload);
    return data;
  },

  deleteBonuses: async (id: string): Promise<void> => {
    await api.delete(`/bonuses/${id}`);
  },
};
