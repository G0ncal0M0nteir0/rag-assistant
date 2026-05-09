const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserData {
  id: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const authApi = {
  async register(email: string, password: string): Promise<UserData> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.detail || "Registration failed");
    }

    return response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.detail || "Login failed");
    }

    return response.json();
  },
};