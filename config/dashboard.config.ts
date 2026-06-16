import {
  Building2,
  Globe2,
  Map,
  MapPinned,
  Shield,
  Boxes,
  CreditCard,
  ShoppingCart,
  Receipt,
  BriefcaseBusiness,
  Wrench,
  Truck,
  Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppRoleKey =
  | "super-admin"
  | "admin-city"
  | "admin-subcity"
  | "admin-woreda"
  | "admin-zone"
  | "asset-manager"
  | "manager"
  | "head-of-development-branch"
  | "head-of-service-branch"
  | "procurement-requester"
  | "payment-requester"
  | "planning-budget-team-leader"
  | "planning-budget-experts"
  | "records-office"
  | "finance"
  | "finance-accountant"
  | "asset-team-leader"
  | "machinery-team-leader";

export type DashboardDefinition = {
  key: AppRoleKey;
  roleName: string;
  title: string;
  subtitle: string;
  route: string;
  icon: LucideIcon;
};

export const roleHome: Record<AppRoleKey, string> = {
  "super-admin": "/dashboard/super-admin",
  "admin-city": "/dashboard/admin-city",
  "admin-subcity": "/dashboard/admin-subcity",
  "admin-woreda": "/dashboard/admin-woreda",
  "admin-zone": "/dashboard/admin-zone",
  "asset-manager": "/dashboard/assets",
  "manager": "/dashboard/manager",
  "head-of-development-branch": "/dashboard/head-of-development-branch",
  "head-of-service-branch": "/dashboard/head-of-service-branch",
  "procurement-requester": "/dashboard/procurement",
  "payment-requester": "/dashboard/payment",
  "planning-budget-team-leader": "/dashboard/planning-budget-team-leader",
  "planning-budget-experts": "/dashboard/planning-budget-experts",
  "records-office": "/dashboard/record-office",
  "finance": "/dashboard/payment",
  "finance-accountant": "/dashboard/finance-accountant",
  "asset-team-leader": "/dashboard/asset-team-leader",
  "machinery-team-leader": "/dashboard/machinery-team-leader",
};

export const dashboardConfig: Record<AppRoleKey, DashboardDefinition> = {
  "super-admin": {
    key: "super-admin",
    roleName: "Super Admin",
    title: "Super Admin Dashboard",
    subtitle: "Full municipality system management.",
    route: roleHome["super-admin"],
    icon: Shield,
  },
  "admin-city": {
    key: "admin-city",
    roleName: "City Admin",
    title: "City Admin Dashboard",
    subtitle: "City administration workspace.",
    route: roleHome["admin-city"],
    icon: Building2,
  },
  "admin-subcity": {
    key: "admin-subcity",
    roleName: "Subcity Admin",
    title: "Subcity Admin Dashboard",
    subtitle: "Subcity administration workspace.",
    route: roleHome["admin-subcity"],
    icon: Globe2,
  },
  "admin-woreda": {
    key: "admin-woreda",
    roleName: "Woreda Admin",
    title: "Woreda Admin Dashboard",
    subtitle: "Woreda administration workspace.",
    route: roleHome["admin-woreda"],
    icon: Map,
  },
  "admin-zone": {
    key: "admin-zone",
    roleName: "Zone Admin",
    title: "Zone Admin Dashboard",
    subtitle: "Zone administration workspace.",
    route: roleHome["admin-zone"],
    icon: MapPinned,
  },
  "asset-manager": {
    key: "asset-manager",
    roleName: "Asset Manager",
    title: "Asset Dashboard",
    subtitle: "Asset management workspace.",
    route: roleHome["asset-manager"],
    icon: Boxes,
  },
  "manager": {
    key: "manager",
    roleName: "Manager",
    title: "Manager Dashboard",
    subtitle: "Approval and workflow management.",
    route: roleHome["manager"],
    icon: BriefcaseBusiness,
  },
  "head-of-development-branch": {
    key: "head-of-development-branch",
    roleName: "Head of Development Branch",
    title: "Development Branch Dashboard",
    subtitle: "Payment and procurement approval workspace.",
    route: roleHome["head-of-development-branch"],
    icon: BriefcaseBusiness,
  },
  "head-of-service-branch": {
    key: "head-of-service-branch",
    roleName: "Head of Service Branch",
    title: "Service Branch Dashboard",
    subtitle: "Payment and procurement approval workspace.",
    route: roleHome["head-of-service-branch"],
    icon: BriefcaseBusiness,
  },
  "procurement-requester": {
    key: "procurement-requester",
    roleName: "Procurement Requester",
    title: "Procurement Dashboard",
    subtitle: "Procurement request workspace.",
    route: roleHome["procurement-requester"],
    icon: ShoppingCart,
  },
  "payment-requester": {
    key: "payment-requester",
    roleName: "Payment Requester",
    title: "Payment Dashboard",
    subtitle: "Payment request workspace.",
    route: roleHome["payment-requester"],
    icon: CreditCard,
  },
  "planning-budget-team-leader": {
    key: "planning-budget-team-leader",
    roleName: "Planning & Budget Team Leader",
    title: "Budget Dashboard",
    subtitle: "Budget approval workspace.",
    route: roleHome["planning-budget-team-leader"],
    icon: Receipt,
  },
  "planning-budget-experts": {
    key: "planning-budget-experts",
    roleName: "Planning & Budget Expert",
    title: "Budget Expert Dashboard",
    subtitle: "Processing and verification workspace.",
    route: roleHome["planning-budget-experts"],
    icon: Receipt,
  },
  "records-office": {
    key: "records-office",
    roleName: "Records Office",
    title: "Records Dashboard",
    subtitle: "Registration and stamping workspace.",
    route: roleHome["records-office"],
    icon: Receipt,
  },
  "finance": {
    key: "finance",
    roleName: "Finance",
    title: "Finance Dashboard",
    subtitle: "Finance and disbursement workspace.",
    route: roleHome["finance"],
    icon: CreditCard,
  },
  "finance-accountant": {
    key: "finance-accountant",
    roleName: "Finance Accountant",
    title: "Finance Accountant Dashboard",
    subtitle: "Payment settlement and paid payment workspace.",
    route: roleHome["finance-accountant"],
    icon: Landmark,
  },
  "asset-team-leader": {
    key: "asset-team-leader",
    roleName: "Asset Team Leader",
    title: "Asset Team Leader Dashboard",
    subtitle: "Fixed asset procurement verification workspace.",
    route: roleHome["asset-team-leader"],
    icon: Wrench,
  },
  "machinery-team-leader": {
    key: "machinery-team-leader",
    roleName: "Machinery Team Leader",
    title: "Machinery Team Leader Dashboard",
    subtitle: "Machinery procurement technical review workspace.",
    route: roleHome["machinery-team-leader"],
    icon: Truck,
  },
};

export function normalizeRoleKey(role?: string | null): AppRoleKey {
  const normalized = (role || "super-admin")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

  const aliases: Record<string, AppRoleKey> = {
    "planning-and-budget-expert": "planning-budget-experts",
    "planning-and-budget-experts": "planning-budget-experts",
    "planning-budget-expert": "planning-budget-experts",
    "planning-budget-experts": "planning-budget-experts",
    "planing-and-budget-expert": "planning-budget-experts",
    "planing-budget-expert": "planning-budget-experts",
    "planning-and-budget-team-leader": "planning-budget-team-leader",
    "planning-budget-team-leader": "planning-budget-team-leader",
    "planing-and-budget-team-leader": "planning-budget-team-leader",
    "budget-team-leader": "planning-budget-team-leader",
    "records-office": "records-office",
    "record-office": "records-office",
    manager: "manager",
    "head-of-development-branch": "head-of-development-branch",
    "head-development-branch": "head-of-development-branch",
    "development-branch-head": "head-of-development-branch",
    "head-of-service-branch": "head-of-service-branch",
    "head-service-branch": "head-of-service-branch",
    "service-branch-head": "head-of-service-branch",
    "asset-team-leader": "asset-team-leader",
    "fixed-asset-team-leader": "asset-team-leader",
    "machinery-team-leader": "machinery-team-leader",
    "machine-team-leader": "machinery-team-leader",
    "finance-accountant": "finance-accountant",
    accountant: "finance-accountant",
    "finance-officer": "finance-accountant",
    finance: "finance-accountant",
  };

  return aliases[normalized] ?? ((normalized as AppRoleKey) in dashboardConfig ? (normalized as AppRoleKey) : "super-admin");
}

export function getDashboardForRole(role?: string | null) {
  return dashboardConfig[normalizeRoleKey(role)];
}
