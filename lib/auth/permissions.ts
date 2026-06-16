"use client";

import { useMemo } from "react";
import { authService } from "@/services/auth/auth.service";

function normalize(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s-]+/g, "_");
}

function hasPermissionMatch(permission: string, permissions: string[]) {
  if (permissions.includes("*") || permissions.includes("all")) return true;
  return (
    permissions.includes(permission) ||
    permissions.includes(permission.replace(".read", ".view")) ||
    permissions.includes(permission.replace(".view", ".read"))
  );
}

export function getStoredPermissions(): string[] {
  return authService.getStoredPermissions();
}

export function getStoredRoles(): string[] {
  const user = authService.getStoredUser();
  const roles = authService.getStoredRoles();
  return roles.length ? roles : user?.role ? [user.role] : [];
}

export function isGeneralAdmin(roles: string[] = getStoredRoles()) {
  return roles.some((role) => {
    const normalized = normalize(role);
    return normalized === "super_admin" || normalized === "general_admin" || normalized === "admin" || normalized === "administrator";
  });
}

export function can(permission: string, permissions: string[] = getStoredPermissions(), roles: string[] = getStoredRoles()) {
  if (!permission) return true;
  if (isGeneralAdmin(roles)) return true;
  return hasPermissionMatch(permission, permissions);
}

export function canAny(required: string[] = [], permissions: string[] = getStoredPermissions(), roles: string[] = getStoredRoles()) {
  if (!required.length) return true;
  if (isGeneralAdmin(roles)) return true;
  return required.some((permission) => hasPermissionMatch(permission, permissions));
}

export function canAll(required: string[] = [], permissions: string[] = getStoredPermissions(), roles: string[] = getStoredRoles()) {
  if (!required.length) return true;
  if (isGeneralAdmin(roles)) return true;
  return required.every((permission) => hasPermissionMatch(permission, permissions));
}

export function usePermissions() {
  const permissions = getStoredPermissions();
  const roles = getStoredRoles();

  return useMemo(
    () => ({
      permissions,
      roles,
      isAdmin: isGeneralAdmin(roles),
      can: (permission: string) => can(permission, permissions, roles),
      canAny: (required: string[]) => canAny(required, permissions, roles),
      canAll: (required: string[]) => canAll(required, permissions, roles),
    }),
    [JSON.stringify(permissions), JSON.stringify(roles)],
  );
}

export const procurementPermissions = {
  read: "procurement.read",
  create: "procurement.create",
  update: "procurement.update",
  submit: "procurement.submit",
  review: "procurement.review",
  approve: "procurement.approve",
  reject: "procurement.reject",
  forward: "procurement.forward",
  assignBudgetCode: "procurement.assign-budget-code",
  prepareForm: "procurement.form.prepare",
  print: "procurement.print",
  complete: "procurement.complete",
} as const;

export const paymentPermissions = {
  read: "payment.read",
  create: "payment.create",
  update: "payment.update",
  submit: "payment.submit",
  review: "payment.review",
  approve: "payment.approve",
  reject: "payment.reject",
  forward: "payment.forward",
  verifyBudget: "payment.verify-budget",
  prepareForm: "payment.form.prepare",
  process: "payment.process",
  print: "payment.print",
  disburse: "payment.disburse",
  complete: "payment.complete",
} as const;

export const userManagementPermissions = {
  usersRead: "users.read",
  usersCreate: "users.create",
  usersUpdate: "users.update",
  usersDelete: "users.delete",
  usersToggle: "users.toggle",
  usersResetPassword: "users.reset-password",
  rolesRead: "roles.read",
  rolesCreate: "roles.create",
  rolesUpdate: "roles.update",
  rolesAssign: "roles.assign",
  rolesAssignPermissions: "roles.assign-permissions",
  permissionsRead: "permissions.read",
  permissionsCreate: "permissions.create",
  permissionsUpdate: "permissions.update",
  permissionsDelete: "permissions.delete",
} as const;

export const inventoryPermissions = {
  read: "inventory.read",
  create: "inventory.items.create",
  update: "inventory.items.update",
  delete: "inventory.items.delete",
  adjust: "inventory.adjustments.create",
  waste: "inventory.waste.create",
  movements: "inventory.movements.read",
  batches: "inventory.batches.read",
  lowStock: "inventory.low_stock.read",
  valuation: "inventory.valuation.read",
  receive: "stock.receive",
  recipesRead: "recipes.read",
  recipesCreate: "recipes.create",
  recipesUpdate: "recipes.update",
  recipeIntegrity: "recipes.integrity.read",
} as const;

export const purchasePermissions = {
  suppliersRead: "suppliers.read",
  suppliersCreate: "suppliers.create",
  suppliersUpdate: "suppliers.update",
  ordersRead: "purchase_orders.read",
  ordersCreate: "purchase_orders.create",
  ordersSubmit: "purchase_orders.submit",
  ordersApprove: "purchase_orders.approve",
  ordersReceive: "purchase_orders.receive",
  requestsCreate: "purchase_requests.create",
  requestsApprove: "purchase_requests.approve",
} as const;

export const tablePermissions = {
  read: "tables.read",
  create: "tables.create",
  update: "tables.update",
  assign: "tables.assign",
  transfer: "tables.transfer",
  summary: "tables.summary",
  history: "tables.history",
  sections: "tables.sections",
  statusUpdate: "tables.status.update",
  toggle: "tables.toggle",
} as const;

export const menuPermissions = {
  read: "menu.read",
  create: "menu.create",
  update: "menu.update",
  disable: "menu.disable",
  delete: "menu.delete",
} as const;
