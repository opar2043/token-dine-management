import api from "@/lib/api";
import type { ClientBonus } from "@/lib/types";

export interface ListClientBonusesParams {
  workerId?: string;
  clientId?: string;
}

export interface CreateClientBonusPayload {
  workerId: string;
  clientId: string;
  amount: number;
  reason: string;
}

export const clientBonusesService = {
  getBonuses: async (params: ListClientBonusesParams = {}): Promise<ClientBonus[]> => {
    const { data } = await api.get<{ items: ClientBonus[] }>("/clients-bonuses", { params });
    return data.items;
  },

  createBonus: async (payload: CreateClientBonusPayload): Promise<ClientBonus> => {
    const { data } = await api.post<ClientBonus>("/clients-bonuses", payload);
    return data;
  },

  deleteBonus: async (id: string): Promise<void> => {
    await api.delete(`/clients-bonuses/${id}`);
  },
};
