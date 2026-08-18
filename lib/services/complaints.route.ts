import api from "@/lib/api";
import type { Complaint, ComplaintStatus } from "@/lib/types";

export interface ListComplaintsParams {
  status?: ComplaintStatus;
}

export interface CreateComplaintPayload {
  byId: string;
  subject: string;
}

export const complaintsService = {
  getComplaints: async (
    params: ListComplaintsParams = {}
  ): Promise<Complaint[]> => {
    const { data } = await api.get<{ items: Complaint[] }>("/complaints", { params });
    return data.items;
  },

  createComplaints: async (payload: CreateComplaintPayload): Promise<Complaint> => {
    const { data } = await api.post<Complaint>("/complaints", payload);
    return data;
  },

  updateComplaintStatus: async (
    id: string,
    status: ComplaintStatus
  ): Promise<Complaint> => {
    const { data } = await api.patch<Complaint>(`/complaints/${id}/status`, { status });
    return data;
  },

  deleteComplaints: async (id: string): Promise<void> => {
    await api.delete(`/complaints/${id}`);
  },
};
