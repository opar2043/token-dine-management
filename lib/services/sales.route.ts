import api from "@/lib/api";
import type { TokenSale } from "@/lib/types";

export interface ListSalesParams {
  workerId?: string;
  clientId?: string;
  from?: string;
  to?: string;
}

export interface CreateSalePayload {
  clientId: string;
  workerId: string;
  tokens: number;
  amount: number;
}

export const salesService = {
  getSales: async (params: ListSalesParams = {}): Promise<TokenSale[]> => {
    const { data } = await api.get<{ items: TokenSale[] }>("/sales", { params });
    return data.items;
  },

  createSales: async (payload: CreateSalePayload): Promise<TokenSale> => {
    const { data } = await api.post<TokenSale>("/sales", payload);
    return data;
  },
};
