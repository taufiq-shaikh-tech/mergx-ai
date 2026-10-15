export type Severity = "Critical" | "High" | "Medium" | "Low";

export type AnalysisCategory = "Integration" | "Security" | "Dependencies" | "Configuration";

export type Finding = {
  id: string;
  ruleId?: string;
  title: string;
  category: AnalysisCategory;
  severity: Severity;
  filePath: string;
  lineNumber?: number;
  description: string;
  recommendation: string;
  codeSnippet?: string;
  impact?: string;
  confidence?: string;
  status?: "open" | "resolved" | "ignored";
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "Completed" | "In Progress" | "Failed";
  date: string;
  issues: number;
  technology: string[];
  repoUrl?: string;
  totalFiles?: number;
  totalLines?: number;
  healthScore?: number;
};

export type ScanRecord = {
  id: string;
  project: string;
  type: string;
  date: string;
  duration: string;
  status: "Completed" | "Failed" | "In Progress";
  issues: number;
  score?: number;
};

export type DependencyItem = {
  id?: string;
  name: string;
  version: string;
  latest: string;
  type: "direct" | "dev" | "peer";
  status: "secure" | "outdated" | "vulnerable";
  cve?: string;
  license: string;
  manifestFile?: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type?: "system" | "analysis" | "security" | "team";
};

export type ReportItem = {
  id: string;
  name: string;
  project: string;
  type: "Integration" | "Security" | "Dependencies" | "Full Audit";
  date: string;
  status: "Generated" | "Pending Analysis";
  issues: number;
  score: number;
  fileSize: string;
};

export type DashboardStats = {
  totalProjects: number;
  totalScans: number;
  openIssues: number;
  criticalIssues: number;
  averageScore: number | null;
  recentProjects: Project[];
  recentActivity: {
    id: string;
    title: string;
    description: string;
    time: string;
    status: string;
  }[];
};

export type AnalysisProgressData = {
  jobId: string;
  projectId: string;
  projectName: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  currentStage: string;
  stages: { id: string; name: string; status: "pending" | "running" | "completed" | "failed" }[];
  logs: string[];
  score: number;
  duration: string;
  errorMessage?: string;
};

export type AnalysisResultsData = {
  jobId: string;
  projectId: string;
  projectName: string;
  status: string;
  score: number;
  duration: string;
  date: string;
  findings: Finding[];
  totalIssues: number;
  categoryCounts: Record<AnalysisCategory, number>;
  severityCounts: Record<Severity, number>;
  technologies: string[];
  totalFiles: number;
  totalLines: number;
};
