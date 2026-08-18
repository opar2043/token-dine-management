import api from "@/lib/api";
import type { AccountStatus, Role, User } from "@/lib/types";

export interface ListUsersParams {
  role?: Role;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  mobile?: string;
  email?: string;
  password: string;
  role: Role;
  status?: AccountStatus;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export const usersService = {
  getUsers: async (params: ListUsersParams = {}): Promise<{ items: User[]; total: number }> => {
    const { data } = await api.get<{ items: User[]; total: number }>("/users", { params });
    return data;
  },

  getUser: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  createUsers: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<User>("/users", payload);
    return data;
  },

  updateUsers: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${id}`, payload);
    return data;
  },

  updateUserStatus: async (id: string, status: AccountStatus): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${id}/status`, { status });
    return data;
  },

  deleteUsers: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
