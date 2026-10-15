import { supabase } from "./supabase";
import type {
  AnalysisProgressData,
  AnalysisResultsData,
  DashboardStats,
  DependencyItem,
  Finding,
  NotificationItem,
  Project,
  ReportItem,
  ScanRecord,
} from "../types";

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "https://mergx-ai.onrender.com";

export function buildApiUrl(endpoint: string): string {
  const base = (RAW_API_BASE || "https://mergx-ai.onrender.com").trim().replace(/\/+$/, "");
  let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Prevent duplicate /api/v1 prefixes if base already has /api/v1
  if (base.endsWith("/api/v1") && path.startsWith("/api/v1/")) {
    path = path.slice(7);
  } else if (base.endsWith("/api") && path.startsWith("/api/")) {
    path = path.slice(4);
  }

  return `${base}${path}`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else if (import.meta.env.DEV) {
      headers["Authorization"] = "Bearer dev-token";
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      headers["Authorization"] = "Bearer dev-token";
    } else {
      console.warn("[Auth] Could not retrieve Supabase session token:", err);
    }
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const url = buildApiUrl(endpoint);
  const method = options.method || "GET";

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netError: any) {
    const isNetworkOrCors =
      netError?.name === "TypeError" ||
      netError?.message?.includes("Failed to fetch") ||
      netError?.message?.includes("NetworkError");

    console.error(`[API Network Error] ${method} ${url} failed:`, {
      endpoint,
      errorName: netError?.name,
      errorMessage: netError?.message,
      targetUrl: url,
      hint: "Check CORS configuration on Render backend or ensure backend service is awake.",
    });

    if (isNetworkOrCors) {
      throw new Error(
        `Cannot connect to backend server at ${url}. Ensure the backend is running, awake, and CORS allows this origin.`
      );
    }
    throw netError;
  }

  // Parse response
  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const serverMessage =
      json?.error?.message ||
      json?.detail ||
      `Request failed with status ${response.status}: ${response.statusText}`;

    console.error(`[API Error ${response.status}] ${method} ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      serverMessage,
      payload: json,
    });

    if (response.status === 401) {
      throw new Error(
        serverMessage || "You are not authenticated. Please log in to access your projects and analysis."
      );
    }

    throw new Error(serverMessage);
  }

  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>("/api/v1/projects");
  },

  async getProject(id: string): Promise<Project & { recentScans?: any[] }> {
    return request<Project & { recentScans?: any[] }>(`/api/v1/projects/${id}`);
  },

  async createProject(data: {
    name: string;
    description?: string;
    technology?: string[];
    repoUrl?: string;
  }): Promise<Project> {
    return request<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async uploadProjectZip(
    file: File,
    projectName?: string,
    description?: string
  ): Promise<{ projectId: string; jobId: string; name: string; status: string; fileCount: number }> {
    const formData = new FormData();
    formData.append("file", file);
    if (projectName) formData.append("projectName", projectName);
    if (description) formData.append("description", description);

    return request<{ projectId: string; jobId: string; name: string; status: string; fileCount: number }>(
      "/api/v1/projects/upload",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  async getProjectDependencies(projectId: string): Promise<DependencyItem[]> {
    return request<DependencyItem[]>(`/api/v1/projects/${projectId}/dependencies`);
  },

  async getAllDependencies(): Promise<DependencyItem[]> {
    return request<DependencyItem[]>("/api/v1/projects/dependencies/all");
  },

  async getFindings(category?: string): Promise<Finding[]> {
    const query = category && category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
    return request<Finding[]>(`/api/v1/results${query}`);
  },

  // Analysis & Scans
  async triggerAnalysis(projectId: string, analysisTypes?: string[]): Promise<{ jobId: string; status: string }> {
    return request<{ jobId: string; status: string }>("/api/v1/analysis", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId, analysis_types: analysisTypes }),
    });
  },

  async getAnalysisProgress(jobId: string): Promise<AnalysisProgressData> {
    return request<AnalysisProgressData>(`/api/v1/analysis/${jobId}`);
  },

  async getAnalysisResults(jobId: string): Promise<AnalysisResultsData> {
    return request<AnalysisResultsData>(`/api/v1/results/${jobId}`);
  },

  async updateFindingStatus(findingId: string, status: "open" | "resolved" | "ignored"): Promise<void> {
    await request(`/api/v1/results/findings/${findingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // History
  async getScanHistory(): Promise<ScanRecord[]> {
    return request<ScanRecord[]>("/api/v1/history");
  },

  // Reports
  async getReports(): Promise<ReportItem[]> {
    return request<ReportItem[]>("/api/v1/reports");
  },

  async generateReport(jobId: string, reportType: string = "Full Audit"): Promise<ReportItem> {
    return request<ReportItem>("/api/v1/reports/generate", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, report_type: reportType }),
    });
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return request<NotificationItem[]>("/api/v1/notifications");
  },

  async markNotificationRead(id: number): Promise<void> {
    await request(`/api/v1/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>("/api/v1/stats");
  },
};
