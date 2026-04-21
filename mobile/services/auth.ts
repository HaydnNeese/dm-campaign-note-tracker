// ─── Auth API service ───────────────────────────────────────

import { api, setToken } from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types";

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  await setToken(res.token);
  return res;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  await setToken(res.token);
  return res;
}

export async function getMe(): Promise<{ user: User }> {
  return api.get<{ user: User }>("/auth/me");
}
