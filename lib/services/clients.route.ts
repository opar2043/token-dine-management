import api from "@/lib/api";
import type { Client, ClientPurchase } from "@/lib/types";

export interface ListClientsParams {
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateClientPayload {
  name: string;
  mobile: string;
  nid: string;
  email?: string;
  address?: string;
  gender?: "male" | "female" | "other";
  referral?: string;
  rating?: number;
  tokensBought?: number;
  tokensSpent?: number;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export interface CreatePurchasePayload {
  productId: string;
  qty: number;
  tokensUsed: number;
}

export type PurchaseRange = "today" | "week" | "month";

export const clientsService = {
  getClients: async (
    params: ListClientsParams = {}
  ): Promise<{ items: Client[]; total: number }> => {
    const { data } = await api.get<{ items: Client[]; total: number }>("/clients", { params });
    return data;
  },

  getClient: async (id: string): Promise<Client> => {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },

  createClients: async (payload: CreateClientPayload): Promise<Client> => {
    const { data } = await api.post<Client>("/clients", payload);
    return data;
  },

  updateClients: async (id: string, payload: UpdateClientPayload): Promise<Client> => {
    const { data } = await api.patch<Client>(`/clients/${id}`, payload);
    return data;
  },

  deleteClients: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  getClientPurchases: async (
    id: string,
    range?: PurchaseRange
  ): Promise<ClientPurchase[]> => {
    const { data } = await api.get<{ items: ClientPurchase[] }>(
      `/clients/${id}/purchases`,
      { params: range ? { range } : {} }
    );
    return data.items;
  },

  addClientPurchase: async (
    id: string,
    payload: CreatePurchasePayload
  ): Promise<ClientPurchase> => {
    const { data } = await api.post<ClientPurchase>(`/clients/${id}/purchases`, payload);
    return data;
  },

  deleteClientPurchase: async (clientId: string, purchaseId: string): Promise<void> => {
    await api.delete(`/clients/${clientId}/purchases/${purchaseId}`);
  },
};
