import api from "@/lib/api";
import type { DailyProgress } from "@/lib/types";

export interface ListProgressParams {
  workerId?: string;
  date?: string;
}

export interface CreateProgressPayload {
  workerId: string;
  table: string;
  tokenGiven: number;
  tokenSold: number;
  notes?: string;
}

export const progressService = {
  getProgress: async (params: ListProgressParams = {}): Promise<DailyProgress[]> => {
    const { data } = await api.get<{ items: DailyProgress[] }>("/progress", { params });
    return data.items;
  },

  createProgress: async (payload: CreateProgressPayload): Promise<DailyProgress> => {
    const { data } = await api.post<DailyProgress>("/progress", payload);
    return data;
  },

  deleteProgress: async (id: string): Promise<void> => {
    await api.delete(`/progress/${id}`);
  },
};
