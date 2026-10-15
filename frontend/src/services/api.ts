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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/").replace(/\/$/, "");

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
      console.warn("Could not retrieve Supabase session token:", err);
    }
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        json?.error?.message ||
        json?.detail ||
        `Request failed with status ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    if (json && typeof json === "object" && "data" in json) {
      return json.data as T;
    }

    return json as T;
  } catch (error: any) {
    if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw error;
  }
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
