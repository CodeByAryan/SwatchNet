import { authenticatedApiRequest } from "./authenticatedApi";
import type { UserRole } from "../session/roles";

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiReport {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: "submitted" | "in_progress" | "resolved" | "rejected";
  latitude: number;
  longitude: number;
  locationName: string | null;
  reporterId: string;
  reporterName: string;
  assignedVolunteerId: string | null;
  assignedVolunteerName: string | null;
  activeTaskId: string | null;
  activeTaskStatus: string | null;
  resolvedPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTask {
  id: string;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  instructions: string | null;
  notes: string | null;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  pointsAwarded: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  volunteerId: string;
  volunteerName: string;
  report: {
    id: string;
    title: string;
    category: string;
    status: string;
    latitude: number;
    longitude: number;
    locationName: string | null;
  };
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  area: string | null;
  role: UserRole;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiApplication {
  id: string;
  status: "pending" | "approved" | "rejected";
  motivation: string;
  area: string | null;
  availability: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  applicant: { id: string; name: string; email: string; role: string };
}

export interface ApiActivity {
  id: string;
  action: string;
  actorName: string | null;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
}

export interface CitizenSummary {
  reports: { total: number; submitted: number; inProgress: number; resolved: number; rejected: number };
  points: number;
  pendingApplications: number;
}

export interface VolunteerSummary {
  tasks: { total: number; assigned: number; in_progress: number; completed: number; cancelled: number };
  points: number;
  completed: number;
}

export interface OperationsStats {
  reports: { total: number; submitted: number; in_progress: number; resolved: number; rejected: number };
  tasks: { total: number; assigned: number; in_progress: number; completed: number; cancelled: number };
  pendingApplications: number;
  activeVolunteers: number;
}

export interface PlatformStats {
  users: { total: number; byRole: Record<UserRole, number>; newLast7Days: number };
  reports: { total: number; submitted: number; inProgress: number; resolved: number; rejected: number };
  tasks: { total: number; assigned: number; inProgress: number; completed: number; cancelled: number };
  applications: { pending: number };
  activityToday: number;
}

/** Thin wrapper so callers always get parsed data or a thrown Error. */
export async function apiCall<T>(
  path: string,
  init?: RequestInit & { body?: unknown },
): Promise<T> {
  const { body, ...rest } = init ?? {};
  const response = await authenticatedApiRequest<ApiEnvelope<T>>(path, {
    ...rest,
    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json", ...(rest.headers ?? {}) },
        }
      : {}),
  });

  if (!response.success) {
    const error = new Error(response.error?.message ?? "Request failed") as Error & { code?: string };
    error.code = response.error?.code;
    throw error;
  }
  return response.data as T;
}

export async function safeApiCall<T>(
  path: string,
  init?: RequestInit & { body?: unknown },
): Promise<{ ok: true; data: T } | { ok: false; error: Error }> {
  try {
    return { ok: true, data: await apiCall<T>(path, init) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error("Request failed") };
  }
}

export const REPORT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

export const REPORT_CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "roadside_litter", label: "Roadside litter" },
  { value: "overflowing_bin", label: "Overflowing bin" },
  { value: "illegal_dumping", label: "Illegal dumping" },
  { value: "organic_drain_clog", label: "Drain clog / organic" },
  { value: "construction_waste", label: "Construction waste" },
  { value: "hazardous_materials", label: "Hazardous materials" },
] as const;

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
