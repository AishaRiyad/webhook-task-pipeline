import type {
  Job,
  JobDetailsResponse,
  LoginResponse,
  MetricsResponse,
  Pipeline,
  PipelineLink,
} from "../types";
import type { SystemNotification } from "../types";

export type Subscriber = {
  id: string;
  pipeline_id: string;
  target_url: string;
  is_active?: boolean;
  created_at: string;
};

const API_BASE = "http://localhost:3000";

function getToken() {
  return localStorage.getItem("frontend_access_token") || "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: string }).message || "Request failed")
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email: string, password: string) {
  return request<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getPipelines() {
  return request<{ data: Pipeline[] }>("/pipelines");
}

export async function createPipeline(payload: {
  name: string;
  action_type: string;
  action_config?: Record<string, unknown>;
  subscribers?: Array<{ target_url: string }>;
}) {
  return request<{ message: string; data: Pipeline }>("/pipelines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deletePipeline(pipelineId: string) {
  return request<{ message: string; data: Pipeline }>(`/pipelines/${pipelineId}`, {
    method: "DELETE",
  });
}

export async function createPipelineLink(sourcePipelineId: string, targetPipelineId: string) {
  return request<{ message: string; data: PipelineLink }>(`/pipelines/${sourcePipelineId}/links`, {
    method: "POST",
    body: JSON.stringify({
      target_pipeline_id: targetPipelineId,
    }),
  });
}

export async function deletePipelineLink(sourcePipelineId: string, targetPipelineId: string) {
  return request<{ message: string; data: PipelineLink }>(
    `/pipelines/${sourcePipelineId}/links/${targetPipelineId}`,
    {
      method: "DELETE",
    }
  );
}

export async function getPipelineSubscribers(pipelineId: string) {
  return request<{ data: Subscriber[] }>(`/pipelines/${pipelineId}/subscribers`);
}

export async function addPipelineSubscriber(pipelineId: string, targetUrl: string) {
  return request<{ message: string; data: Subscriber }>(`/pipelines/${pipelineId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({
      target_url: targetUrl,
    }),
  });
}

export async function deletePipelineSubscriber(pipelineId: string, subscriberId: string) {
  return request<{ message: string; data: Subscriber }>(
    `/pipelines/${pipelineId}/subscribers/${subscriberId}`,
    {
      method: "DELETE",
    }
  );
}

export async function getJobs() {
  return request<{ data: Job[] }>("/jobs");
}

export async function getJobDetails(jobId: string) {
  return request<{ data: JobDetailsResponse }>(`/jobs/${jobId}`);
}

export async function getPipelineLinks(pipelineId: string) {
  return request<{ data: PipelineLink[] }>(`/pipelines/${pipelineId}/links`);
}

export async function getMetrics() {
  return request<MetricsResponse>("/metrics");
}

export async function getNotifications() {
  return request<{ data: SystemNotification[] }>("/notifications");
}

export async function markNotificationAsRead(notificationId: string) {
  return request<{ message: string; data: SystemNotification }>(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    }
  );
}

export async function getUnreadNotificationsCount() {
  return request<{ unread_count: number }>("/notifications/unread-count");
}
