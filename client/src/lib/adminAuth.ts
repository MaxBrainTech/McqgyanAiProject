export type AdminSession = {
  email: string;
  authenticatedAt: string;
};

type AdminLoginResponse = {
  admin: AdminSession;
  message?: string;
};

export async function fetchAdminSession(): Promise<AdminSession | null> {
  const res = await fetch("/api/admin/session", {
    credentials: "include",
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || "Failed to load admin session");
  }

  const data = (await res.json()) as AdminLoginResponse;
  return data.admin ?? null;
}

export async function loginAdmin(email: string, password: string) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || "Failed to authenticate admin");
  }

  const data = (await res.json()) as AdminLoginResponse;
  return data.admin;
}

export async function logoutAdmin() {
  const res = await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || "Failed to end admin session");
  }
}

