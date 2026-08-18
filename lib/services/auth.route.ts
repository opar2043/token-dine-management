import api from "@/lib/api";
import type { Role, User } from "@/lib/types";

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface StaffLoginPayload {
  mobile: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  role: Role;
}

export const authService = {
  loginAdmin: async (payload: AdminLoginPayload): Promise<User> => {
    const { data } = await api.post<{ user: User }>("/auth/login/admin", payload);
    return data.user;
  },

  loginStaff: async (payload: StaffLoginPayload): Promise<User> => {
    const { data } = await api.post<{ user: User }>("/auth/login/staff", payload);
    return data.user;
  },

  register: async (payload: RegisterPayload): Promise<User> => {
    const { data } = await api.post<{ user: User }>("/auth/register", payload);
    return data.user;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
