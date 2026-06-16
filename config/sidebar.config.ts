import {
  Bell,
  BarChart3,
  Home,
  IdCard,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  Users,
  ClipboardList,
  FileText,
  CreditCard,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getDashboardForRole } from "@/config/dashboard.config";

export type AdminLevel = "city" | "subcity" | "woreda" | "zone";

export type SidebarChildItem = {
  label: string;
  labelKey?: string;
  href: string;
  permission?: string;
  levels?: AdminLevel[];
  superOnly?: boolean;
};

export type SidebarItem = {
  label: string;
  labelKey?: string;
  href?: string;
  icon: LucideIcon;
  permission?: string;
  levels?: AdminLevel[];
  superOnly?: boolean;
  children?: SidebarChildItem[];
};

export type SidebarSection = {
  title: string;
  titleKey?: string;
  items: SidebarItem[];
};

export type RoleSidebar = {
  title: string;
  icon: LucideIcon;
  adminLevel?: string | null;
  sections: SidebarSection[];
};

const paymentsChild: SidebarChildItem = {
  label: "Payments",
  labelKey: "sidebar.payments",
  href: "/dashboard/payment",
};

const paymentCategoriesChild: SidebarChildItem = {
  label: "Payment Categories",
  labelKey: "sidebar.payment_categories",
  href: "/dashboard/payment-categories",
};

const paymentTypesChild: SidebarChildItem = {
  label: "Payment Types",
  labelKey: "sidebar.payment_types",
  href: "/dashboard/payment-types",
};

const procurementsChild: SidebarChildItem = {
  label: "Procurements",
  labelKey: "sidebar.procurements",
  href: "/dashboard/procurement",
};

const budgetsChild: SidebarChildItem = {
  label: "Budgets",
  labelKey: "sidebar.budgets",
  href: "/dashboard/budgets",
};

const usersChild: SidebarChildItem = {
  label: "Users",
  labelKey: "sidebar.users",
  href: "/dashboard/users",
  permission: "users.view",
};

const rolesPermissionsChild: SidebarChildItem = {
  label: "Roles & Permissions",
  labelKey: "sidebar.roles_permissions",
  href: "/dashboard/users/roles",
  permission: "roles.view",
};

const translationsChild: SidebarChildItem = {
  label: "Translations",
  labelKey: "sidebar.translations",
  href: "/dashboard/translations",
  permission: "translations.view",
};

const paymentReportChild: SidebarChildItem = {
  label: "Payment Report",
  labelKey: "sidebar.payment_report",
  href: "/dashboard/reports/procurement-payment?type=payment",
};

const procurementReportChild: SidebarChildItem = {
  label: "Procurement Report",
  labelKey: "sidebar.procurement_report",
  href: "/dashboard/reports/procurement-payment?type=procurement",
};

const paymentManagementSection = (children: SidebarChildItem[]): SidebarSection => ({
  title: "Payment Management",
  titleKey: "sidebar.payment_management",
  items: [
    {
      label: "Payments",
      labelKey: "sidebar.payments",
      icon: CreditCard,
      children,
    },
  ],
});

const procurementManagementSection = (children: SidebarChildItem[]): SidebarSection => ({
  title: "Procurement Management",
  titleKey: "sidebar.procurement_management",
  items: [
    {
      label: "Procurements",
      labelKey: "sidebar.procurements",
      icon: ClipboardList,
      children,
    },
  ],
});

const budgetManagementSection = (children: SidebarChildItem[]): SidebarSection => ({
  title: "Budget Management",
  titleKey: "sidebar.budget_management",
  items: [
    {
      label: "Budgets",
      labelKey: "sidebar.budgets",
      icon: WalletCards,
      children,
    },
  ],
});

const userManagementSection = (
  children: SidebarChildItem[] = [usersChild]
): SidebarSection => ({
  title: "User Management",
  titleKey: "sidebar.user_management",
  items: [
    {
      label: "Users",
      labelKey: "sidebar.users",
      icon: Users,
      children,
    },
  ],
});

const reportSection = (children: SidebarChildItem[]): SidebarSection => ({
  title: "Report",
  titleKey: "sidebar.report",
  items: [
    {
      label: "Reports",
      labelKey: "sidebar.reports",
      icon: BarChart3,
      children,
    },
  ],
});

const paymentProcurementReportSection = reportSection([
  paymentReportChild,
  procurementReportChild,
]);

const procurementOnlyReportSection = reportSection([procurementReportChild]);

const sections: SidebarSection[] = [
  {
    title: "Main",
    titleKey: "sidebar.main",
    items: [
      {
        label: "Dashboard",
        labelKey: "sidebar.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Citizen Management",
    titleKey: "sidebar.citizen_management",
    items: [
      {
        label: "Citizen Dashboard",
        labelKey: "sidebar.citizen_dashboard",
        href: "/dashboard/citizen-dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.citizens.view",
      },
      {
        label: "Citizens",
        labelKey: "sidebar.citizens",
        href: "/dashboard/citizens",
        icon: IdCard,
        permission: "citizens.read",
      },
      {
        label: "Register Citizen",
        labelKey: "sidebar.register_citizen",
        href: "/dashboard/citizens/create",
        icon: IdCard,
        permission: "citizens.create",
        levels: ["zone"],
      },
      {
        label: "Verification Workflow",
        labelKey: "sidebar.verification_workflow",
        icon: ShieldCheck,
        children: [
          {
            label: "Pending Review",
            labelKey: "sidebar.pending_review",
            href: "/dashboard/citizens/pending",
            permission: "citizens.workflow.review",
            levels: ["woreda"],
          },
          {
            label: "Document Verification",
            labelKey: "sidebar.document_verification",
            href: "/dashboard/citizens/verification",
            permission: "citizens.workflow.verify-documents",
            levels: ["woreda"],
          },
          {
            label: "Woreda Verification",
            labelKey: "sidebar.woreda_verification",
            href: "/dashboard/citizens/verification",
            permission: "citizens.workflow.woreda-verify",
            levels: ["woreda"],
          },
          {
            label: "Citizen Approval",
            labelKey: "sidebar.citizen_approval",
            href: "/dashboard/citizens/approval",
            permission: "citizens.workflow.subcity-approve",
            levels: ["subcity"],
          },
          {
            label: "ID Generation / Activation",
            labelKey: "sidebar.id_generation_activation",
            href: "/dashboard/citizens/approval",
            permission: "citizens.workflow.generate-id",
            levels: ["city"],
          },
          {
            label: "Duplicate Cases",
            labelKey: "sidebar.duplicate_cases",
            href: "/dashboard/citizens/duplicates",
            permission: "citizens.workflow.flag",
            levels: ["woreda", "subcity", "city"],
          },
        ],
      },
      {
        label: "Households",
        labelKey: "sidebar.households",
        href: "/dashboard/households",
        icon: Home,
        permission: "households.read",
        levels: ["zone"],
      },
    ],
  },
  {
    title: "Procurement & Payment",
    titleKey: "sidebar.procurement_payment",
    items: [
      {
        label: "Procurement",
        labelKey: "sidebar.procurement",
        href: "/dashboard/procurement",
        icon: ClipboardList,
        permission: "procurement.view",
      },
      {
        label: "Create Procurement",
        labelKey: "sidebar.create_procurement",
        href: "/dashboard/procurement/create",
        icon: FileText,
        permission: "procurement.create",
      },
      {
        label: "Payment",
        labelKey: "sidebar.payment",
        href: "/dashboard/payment",
        icon: CreditCard,
        permission: "payment.view",
      },
      {
        label: "Create Payment",
        labelKey: "sidebar.create_payment",
        href: "/dashboard/payment/create",
        icon: FileText,
        permission: "payment.create",
      },
      {
        label: "Payment Categories",
        labelKey: "sidebar.payment_categories",
        href: "/dashboard/payment-categories",
        icon: CreditCard,
        permission: "payment.view",
      },
      {
        label: "Payment Types",
        labelKey: "sidebar.payment_types",
        href: "/dashboard/payment-types",
        icon: FileText,
        permission: "payment.view",
      },
      {
        label: "Procurement & Payment Reports",
        labelKey: "sidebar.procurement_payment_reports",
        href: "/dashboard/reports/procurement-payment",
        icon: BarChart3,
        permission: "reports.view",
      },
    ],
  },
  {
    title: "Administration",
    titleKey: "sidebar.administration",
    items: [
      {
        label: "User Management",
        labelKey: "sidebar.user_management",
        icon: Users,
        permission: "users.read",
        levels: ["city", "subcity", "woreda"],
        children: [
          {
            label: "Users",
            labelKey: "sidebar.users",
            href: "/dashboard/users",
            permission: "users.read",
            levels: ["city", "subcity", "woreda"],
          },
          {
            label: "Roles",
            labelKey: "sidebar.roles",
            href: "/dashboard/users/roles",
            permission: "roles.view",
            superOnly: true,
          },
          {
            label: "Permissions",
            labelKey: "sidebar.permissions",
            href: "/dashboard/users/permissions",
            permission: "permissions.view",
            superOnly: true,
          },
        ],
      },
      {
        label: "Locations",
        labelKey: "sidebar.locations",
        href: "/dashboard/locations",
        icon: MapPinned,
        permission: "offices.read",
        levels: ["city", "subcity", "woreda"],
      },
      {
        label: "Notifications",
        labelKey: "sidebar.notifications",
        href: "/dashboard/notifications",
        icon: Bell,
        permission: "notifications.read",
      },
      {
        label: "Citizen Reports",
        labelKey: "sidebar.citizen_reports",
        href: "/dashboard/reports/citizens",
        icon: BarChart3,
        permission: "reports.citizens.view",
        levels: ["city", "subcity", "woreda"],
      },
    ],
  },
];

const roleSpecificSections: Record<string, SidebarSection[]> = {
  "planning-budget-expert": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "planning-and-budget-expert": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "planning-budget-experts": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "planning-budget-team-leader": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "planning-and-budget-team-leader": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  manager: [
    paymentManagementSection([
      paymentsChild,
      paymentCategoriesChild,
      paymentTypesChild,
    ]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    userManagementSection([usersChild, rolesPermissionsChild, translationsChild]),
    paymentProcurementReportSection,
  ],
  "head-of-development-branch": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "head-development-branch": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "head-of-service-branch": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "head-service-branch": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
    paymentProcurementReportSection,
  ],
  "record-office": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "records-office": [
    paymentManagementSection([paymentsChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "payment-requester": [paymentManagementSection([paymentsChild])],
  "procurement-requester": [procurementManagementSection([procurementsChild])],
  "machinery-team-leader": [
    procurementManagementSection([procurementsChild]),
    procurementOnlyReportSection,
  ],
  "asset-team-leader": [
    procurementManagementSection([procurementsChild]),
    procurementOnlyReportSection,
  ],
  "finance-accountant": [paymentManagementSection([paymentsChild])],
  accountant: [paymentManagementSection([paymentsChild])],
  finance: [paymentManagementSection([paymentsChild])],
};

function normalizeRoleForSidebar(role?: string | null) {
  return String(role ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function getRoleSpecificSections(role?: string | null): SidebarSection[] | null {
  const normalized = normalizeRoleForSidebar(role);
  return roleSpecificSections[normalized] ?? null;
}

export function getSidebarForRole(
  role?: string | null,
  adminLevel?: string | null
): RoleSidebar {
  const dashboard = getDashboardForRole(role);
  const specificSections = getRoleSpecificSections(role);

  return {
    title: dashboard.roleName,
    icon: dashboard.icon,
    adminLevel,
    sections: specificSections ?? sections,
  };
}

function isSuperAdminRole(role?: string | null) {
  return String(role ?? "").toLowerCase().includes("super");
}

function allowedByPermission(
  permission: string | undefined,
  permissions: string[]
) {
  if (!permission) return true;

  if (permissions.includes("*") || permissions.includes("all")) {
    return true;
  }

  return (
    permissions.includes(permission) ||
    permissions.includes(permission.replace(".read", ".view")) ||
    permissions.includes(permission.replace(".view", ".read"))
  );
}

function allowedByLevel(
  item: { levels?: AdminLevel[]; superOnly?: boolean },
  adminLevel?: string | null,
  isSuperAdmin = false
) {
  if (isSuperAdmin) return true;
  if (item.superOnly) return false;
  if (!item.levels?.length) return true;

  return item.levels.includes(String(adminLevel ?? "") as AdminLevel);
}

export function filterSidebarByPermissions(
  roleSidebar: RoleSidebar,
  permissions: string[] = [],
  role?: string | null
) {
  const isSuperAdmin = isSuperAdminRole(role);

  return roleSidebar.sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          const children = item.children?.filter(
            (child) =>
              allowedByPermission(child.permission, permissions) &&
              allowedByLevel(child, roleSidebar.adminLevel, isSuperAdmin)
          );

          if (item.children) {
            return children?.length ? { ...item, children } : null;
          }

          return allowedByPermission(item.permission, permissions) &&
            allowedByLevel(item, roleSidebar.adminLevel, isSuperAdmin)
            ? item
            : null;
        })
        .filter(Boolean) as SidebarItem[],
    }))
    .filter((section) => section.items.length > 0);
}