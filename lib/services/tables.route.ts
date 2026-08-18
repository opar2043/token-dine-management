import api from "@/lib/api";
import type { TableAssignment } from "@/lib/types";

export interface AssignTablePayload {
  table: string;
  workerId: string;
}

export const tablesService = {
  getTables: async (): Promise<TableAssignment[]> => {
    const { data } = await api.get<{ items: TableAssignment[] }>("/tables");
    return data.items;
  },

  assignTables: async (payload: AssignTablePayload): Promise<TableAssignment> => {
    const { data } = await api.post<TableAssignment>("/tables/assign", payload);
    return data;
  },

  releaseTables: async (table: string): Promise<TableAssignment> => {
    const { data } = await api.post<TableAssignment>("/tables/release", { table });
    return data;
  },
};
