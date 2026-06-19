import { Task } from "../types/task";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const body = await response.json();
        if (body.error?.message) {
          message = body.error.message;
        }
      } catch {
        // If we can't parse the error body, use the default message
      }
      throw new ApiError(response.status, message);
    }

    const body = await response.json();
    return body.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(0, "Request timed out. Server is unreachable.");
    }
    throw new ApiError(0, "Connection error. Please check your network.");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchTasks(
  search?: string,
  status?: string
): Promise<Task[]> {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  if (status) {
    params.set("status", status);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/api/tasks${queryString ? `?${queryString}` : ""}`;

  return request<Task[]>(url);
}

export async function createTask(
  title: string,
  description?: string
): Promise<Task> {
  return request<Task>(`${API_BASE}/api/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, description: description || "" }),
  });
}

export async function updateTask(
  id: number,
  updates: Partial<Task>
): Promise<Task> {
  return request<Task>(`${API_BASE}/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await request<{ message: string }>(`${API_BASE}/api/tasks/${id}`, {
    method: "DELETE",
  });
}
