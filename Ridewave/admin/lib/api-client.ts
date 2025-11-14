const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiRequest<TResponse>({
  endpoint,
  method,
  token,
  payload
}: {
  endpoint: string;
  method?: HttpMethod;
  token?: string | null;
  payload?: unknown;
}): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData?.message ?? "Request failed");
    throw error;
  }

  return response.json() as Promise<TResponse>;
}

