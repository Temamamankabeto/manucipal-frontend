"use client";

import RoleDashboard from "@/components/dashboards/RoleDashboard";
import { authService } from "@/services/auth/auth.service";
import type { RoleDashboardScope } from "@/types/dashboard/role-dashboard.type";

type StoredRole = string | { name?: string | null; role?: string | null; title?: string | null } | null | undefined;

const dashboardScopeByRole: Record<string, RoleDashboardScope> = {
  "super-admin": "super_admin",
  manager: "manager",
  "head-of-development-branch": "head_of_development_branch",
  "head-of-service-branch": "head_of_service_branch",
  "team-leader": "team_leader",
  expert: "expert",
  secretory: "secretory",
  secretary: "secretory",
  "record-officer": "record_officer",
  accountant: "accountant",

  // Legacy aliases kept so old stored users do not break.
  superadmin: "super_admin",
  "super-admins": "super_admin",
  "planning-budget-team-leader": "team_leader",
  "planning-and-budget-team-leader": "team_leader",
  "budget-team-leader": "team_leader",
  "planning-budget-expert": "expert",
  "planning-budget-experts": "expert",
  "planning-and-budget-expert": "expert",
  "asset-team-leader": "team_leader",
  "machinery-team-leader": "team_leader",
  "payment-requester": "secretory",
  "procurement-requester": "secretory",
  "records-office": "record_officer",
  "record-office": "record_officer",
  finance: "accountant",
  "finance-accountant": "accountant",
};

const budgetVisibleRoleKeys = new Set([
  "manager",
  "head-of-development-branch",
  "head-of-service-branch",
]);

function roleText(role: StoredRole) {
  if (!role) return "";
  if (typeof role === "string") return role;
  return role.name ?? role.role ?? role.title ?? "";
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeDashboardRoleKey(role: StoredRole) {
  const key = normalizeText(roleText(role));
  return key && dashboardScopeByRole[key] ? key : null;
}

function getDepartmentName(user: any) {
  return (
    user?.department?.name ??
    user?.department_name ??
    user?.departmentName ??
    user?.department ??
    ""
  );
}

function isBudgetDepartment(user: any) {
  const departmentKey = normalizeText(getDepartmentName(user));

  return departmentKey === "budget-department" || departmentKey.includes("budget");
}

function canShowBudgetDashboard(roleKey: string, user: any) {
  if (budgetVisibleRoleKeys.has(roleKey)) return true;

  if (["team-leader", "expert", "planning-budget-team-leader", "planning-budget-experts"].includes(roleKey)) {
    return isBudgetDepartment(user);
  }

  return false;
}

function resolveDashboardRoleKey(user: any, storedRoles: StoredRole[]) {
  const candidates: StoredRole[] = [
    user?.role,
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...storedRoles,
  ];

  for (const candidate of candidates) {
    const roleKey = normalizeDashboardRoleKey(candidate);
    if (roleKey) return roleKey;
  }

  return "manager";
}

export default function DashboardIndexPage() {
  const user = authService.getStoredUser();
  const storedRoles = authService.getStoredRoles() as StoredRole[];
  const roleKey = resolveDashboardRoleKey(user, storedRoles);
  const scope = dashboardScopeByRole[roleKey] ?? "manager";
  const showBudget = canShowBudgetDashboard(roleKey, user);

  return <RoleDashboard scope={scope} showBudget={showBudget} />;
}
