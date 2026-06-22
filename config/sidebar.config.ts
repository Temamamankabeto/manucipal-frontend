import {
  Bell,
  Building2,
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
  translationKey?: string;
  href: string;
  permission?: string;
  levels?: AdminLevel[];
  superOnly?: boolean;
};

export type SidebarItem = {
  label: string;
  translationKey?: string;
  href?: string;
  icon: LucideIcon;
  permission?: string;
  levels?: AdminLevel[];
  superOnly?: boolean;
  children?: SidebarChildItem[];
};

export type SidebarSection = {
  title: string;
  translationKey?: string;
  items: SidebarItem[];
};

export type RoleSidebar = {
  title: string;
  icon: LucideIcon;
  adminLevel?: string | null;
  sections: SidebarSection[];
};

const sections: SidebarSection[] = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",

        translationKey: "dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "",
    items: [
      {
        label: "Citizen Dashboard",

        translationKey: "citizen_dashboard",
        href: "/dashboard/citizen-dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.citizens.view",
      },
      {
        label: "Citizens",

        translationKey: "citizens",
        href: "/dashboard/citizens",
        icon: IdCard,
        permission: "citizens.read",
      },
      {
        label: "Register Citizen",

        translationKey: "register_citizen",
        href: "/dashboard/citizens/create",
        icon: IdCard,
        permission: "citizens.create",
        levels: ["zone"],
      },
      {
        label: "Verification Workflow",

        translationKey: "verification_workflow",
        icon: ShieldCheck,
        children: [
          {
            label: "Pending Review",

            translationKey: "pending_review",
            href: "/dashboard/citizens/pending",
            permission: "citizens.workflow.review",
            levels: ["woreda"],
          },
          {
            label: "Document Verification",

            translationKey: "document_verification",
            href: "/dashboard/citizens/verification",
            permission: "citizens.workflow.verify-documents",
            levels: ["woreda"],
          },
          {
            label: "Woreda Verification",

            translationKey: "woreda_verification",
            href: "/dashboard/citizens/verification",
            permission: "citizens.workflow.woreda-verify",
            levels: ["woreda"],
          },
          {
            label: "Citizen Approval",

            translationKey: "citizen_approval",
            href: "/dashboard/citizens/approval",
            permission: "citizens.workflow.subcity-approve",
            levels: ["subcity"],
          },
          {
            label: "ID Generation / Activation",

            translationKey: "id_generation_activation",
            href: "/dashboard/citizens/approval",
            permission: "citizens.workflow.generate-id",
            levels: ["city"],
          },
          {
            label: "Duplicate Cases",

            translationKey: "duplicate_cases",
            href: "/dashboard/citizens/duplicates",
            permission: "citizens.workflow.flag",
            levels: ["woreda", "subcity", "city"],
          },
        ],
      },
      {
        label: "Households",

        translationKey: "households",
        href: "/dashboard/households",
        icon: Home,
        permission: "households.read",
        levels: ["zone"],
      },
    ],
  },
  {
    title: "",
    items: [
      {
        label: "Procurement",

        translationKey: "procurement",
        href: "/dashboard/procurement",
        icon: ClipboardList,
        permission: "procurement.view",
      },
      {
        label: "Create Procurement",

        translationKey: "create_procurement",
        href: "/dashboard/procurement/create",
        icon: FileText,
        permission: "procurement.create",
      },
      {
        label: "Payment",

        translationKey: "payment",
        href: "/dashboard/payment",
        icon: CreditCard,
        permission: "payment.view",
      },
      {
        label: "Create Payment",

        translationKey: "create_payment",
        href: "/dashboard/payment/create",
        icon: FileText,
        permission: "payment.create",
      },
      {
        label: "Payment Categories",

        translationKey: "payment_categories",
        href: "/dashboard/payment-categories",
        icon: CreditCard,
        permission: "payment.view",
      },
      {
        label: "Payment Types",

        translationKey: "payment_types",
        href: "/dashboard/payment-types",
        icon: FileText,
        permission: "payment.view",
      },
    ],
  },
  {
    title: "",
    items: [
      {
        label: "User Management",

        translationKey: "user_management",
        icon: Users,
        permission: "users.read",
        levels: ["city", "subcity", "woreda"],
        children: [
          {
            label: "Users",

            translationKey: "users",
            href: "/dashboard/users",
            permission: "users.read",
            levels: ["city", "subcity", "woreda"],
          },
          {
            label: "Roles",

            translationKey: "roles",
            href: "/dashboard/users/roles",
            permission: "roles.view",
            superOnly: true,
          },
          {
            label: "Permissions",

            translationKey: "permissions",
            href: "/dashboard/users/permissions",
            permission: "permissions.view",
            superOnly: true,
          },
        ],
      },
      {
        label: "Locations",

        translationKey: "locations",
        href: "/dashboard/locations",
        icon: MapPinned,
        permission: "offices.read",
        levels: ["city", "subcity", "woreda"],
      },
      {
        label: "Offices",

        translationKey: "offices",
        href: "/dashboard/offices",
        icon: Building2,
        permission: "offices.view",
      },
      {
        label: "Departments",

        translationKey: "departments",
        href: "/dashboard/departments",
        icon: Building2,
        permission: "offices.view",
      },
      {
        label: "Notifications",

        translationKey: "notifications",
        href: "/dashboard/notifications",
        icon: Bell,
        permission: "notifications.read",
      },
    ],
  },
];

const paymentManagementSection = (
  children: SidebarChildItem[],
): SidebarSection => ({
  title: "",
  items: [{ label: "Payments",
 translationKey: "payments", icon: CreditCard, children }],
});

const procurementManagementSection = (
  children: SidebarChildItem[],
): SidebarSection => ({
  title: "",
  items: [{ label: "Procurements",
 translationKey: "procurements", icon: ClipboardList, children }],
});

const budgetManagementSection = (
  children: SidebarChildItem[],
): SidebarSection => ({
  title: "",
  items: [{ label: "Budgets",
 translationKey: "budgets", icon: WalletCards, children }],
});

const usersChild: SidebarChildItem = {
  label: "Users",

  translationKey: "users",
  href: "/dashboard/users",
  permission: "users.view",
};

const userManagementSection = (
  children: SidebarChildItem[] = [usersChild],
): SidebarSection => ({
  title: "",
  items: [
    {
      label: "Users",

      translationKey: "users",
      icon: Users,
      children,
    },
  ],
});

const officeManagementSection = (): SidebarSection => ({
  title: "",
  items: [
    {
      label: "Office Setup",

      translationKey: "office_setup",
      icon: Building2,
      children: [
        {
          label: "Offices",

          translationKey: "offices",
          href: "/dashboard/offices",
          permission: "offices.view",
        },
        {
          label: "Departments",

          translationKey: "departments",
          href: "/dashboard/departments",
          permission: "offices.view",
        },
      ],
    },
  ],
});

const paymentsChild: SidebarChildItem = {
  label: "Payments",

  translationKey: "payments",
  href: "/dashboard/payment",
};
const createPaymentChild: SidebarChildItem = {
  label: "Create Payment",

  translationKey: "create_payment",
  href: "/dashboard/payment/create",
  permission: "payment.create",
};
const paymentCategoriesChild: SidebarChildItem = {
  label: "Payment Categories",

  translationKey: "payment_categories",
  href: "/dashboard/payment-categories",
};
const paymentTypesChild: SidebarChildItem = {
  label: "Payment Types",

  translationKey: "payment_types",
  href: "/dashboard/payment-types",
};
const procurementsChild: SidebarChildItem = {
  label: "Procurements",

  translationKey: "procurements",
  href: "/dashboard/procurement",
};
const procurementCategoriesChild: SidebarChildItem = {
  label: "Procurement Categories",

  translationKey: "procurement_categories",
  href: "/dashboard/procurement-categories",
  permission: "procurement.view",
};
const procurementTypesChild: SidebarChildItem = {
  label: "Procurement Types",

  translationKey: "procurement_types",
  href: "/dashboard/procurement-types",
  permission: "procurement.view",
};
const budgetsChild: SidebarChildItem = {
  label: "Budgets",

  translationKey: "budgets",
  href: "/dashboard/budgets",
};
const rolesChild: SidebarChildItem = {
  label: "Roles",

  translationKey: "roles",
  href: "/dashboard/users/roles",
  permission: "roles.view",
};
const permissionsChild: SidebarChildItem = {
  label: "Permissions",

  translationKey: "permissions",
  href: "/dashboard/users/permissions",
  permission: "permissions.view",
};

const roleAndPermissionChild: SidebarChildItem = {
  label: "Role and Permission",

  translationKey: "role_and_permission",
  href: "/dashboard/users/roles",
  permission: "roles.view",
};

const superAdminSections: SidebarSection[] = [
  {
    title: "",
    items: [
      {
        label: "Office Setup",

        translationKey: "office_setup",
        icon: Building2,
        children: [
          { label: "Offices",
 translationKey: "offices", href: "/dashboard/offices" },
          { label: "Departments",
 translationKey: "departments", href: "/dashboard/departments" },
        ],
      },
    ],
  },
  {
    title: "",
    items: [
      {
        label: "Payments",

        translationKey: "payments",
        icon: CreditCard,
        children: [
          {
            label: "Payment Categories",

            translationKey: "payment_categories",
            href: "/dashboard/payment-categories",
          },
          { label: "Payment Types",
 translationKey: "payment_types", href: "/dashboard/payment-types" },
        ],
      },
    ],
  },
  {
    title: "",
    items: [
      {
        label: "Procurements",

        translationKey: "procurements",
        icon: ClipboardList,
        children: [
          {
            label: "Procurement Categories",

            translationKey: "procurement_categories",
            href: "/dashboard/procurement-categories",
          },
          { label: "Procurement Types",
 translationKey: "procurement_types", href: "/dashboard/procurement-types" },
        ],
      },
    ],
  },
  {
    title: "",
    items: [
      {
        label: "Users",

        translationKey: "users",
        icon: Users,
        children: [
          { label: "Users",
 translationKey: "users", href: "/dashboard/users" },
          { label: "Role and Permission",
 translationKey: "role_and_permission", href: "/dashboard/users/roles" },
        ],
      },
    ],
  },
  {
    title: "",
    items: [
      {
        label: "Translations",

        translationKey: "translations",
        href: "/dashboard/translations",
        icon: FileText,
      },
    ],
  },
];

const budgetAllowedRoleKeys = new Set([
  "manager",
  "head-of-development-branch",
  "head-development-branch",
  "head-of-service-branch",
  "head-service-branch",
]);

function normalizeDepartmentForSidebar(department?: string | null) {
  return String(department ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function isBudgetDepartmentForSidebar(department?: string | null) {
  const normalized = normalizeDepartmentForSidebar(department);
  return normalized === "budget-department" || normalized.includes("budget");
}

function canShowBudgetSidebar(
  role?: string | null,
  department?: string | null,
) {
  const normalized = normalizeRoleForSidebar(role);

  if (budgetAllowedRoleKeys.has(normalized)) {
    return true;
  }

  if (
    [
      "team-leader",
      "planning-budget-team-leader",
      "planning-and-budget-team-leader",
      "expert",
      "planning-budget-expert",
      "planning-budget-experts",
      "planning-and-budget-expert",
    ].includes(normalized)
  ) {
    return isBudgetDepartmentForSidebar(department);
  }

  return false;
}

function withConditionalBudgetSection(
  role: string | null | undefined,
  department: string | null | undefined,
  baseSections: SidebarSection[],
) {
  return canShowBudgetSidebar(role, department)
    ? [...baseSections, budgetManagementSection([budgetsChild])]
    : baseSections;
}

const roleSpecificSections: Record<string, SidebarSection[]> = {
  "super-admin": superAdminSections,
  "super-admin-role": superAdminSections,
  superadmin: superAdminSections,
  manager: [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
  ],
  "head-of-development-branch": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
  ],
  "head-development-branch": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
  ],
  "head-of-service-branch": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
  ],
  "head-service-branch": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
    budgetManagementSection([budgetsChild]),
  ],
  secretory: [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  secretary: [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "record-officer": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "record-office": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "records-office": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  accountant: [paymentManagementSection([paymentsChild])],
  finance: [paymentManagementSection([paymentsChild])],
  "finance-accountant": [paymentManagementSection([paymentsChild])],
  "payment-requester": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
  ],
  "procurement-requester": [procurementManagementSection([procurementsChild])],
  "machinery-team-leader": [procurementManagementSection([procurementsChild])],
  "asset-team-leader": [procurementManagementSection([procurementsChild])],
};

const budgetDepartmentRoleBaseSections: Record<string, SidebarSection[]> = {
  "team-leader": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "planning-budget-team-leader": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "planning-and-budget-team-leader": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  expert: [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "planning-budget-expert": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "planning-budget-experts": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
  "planning-and-budget-expert": [
    paymentManagementSection([paymentsChild, createPaymentChild]),
    procurementManagementSection([procurementsChild]),
  ],
};

function normalizeRoleForSidebar(role?: string | null) {
  return String(role ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function getRoleSpecificSections(
  role?: string | null,
  department?: string | null,
): SidebarSection[] | null {
  const normalized = normalizeRoleForSidebar(role);
  const budgetDepartmentBaseSections =
    budgetDepartmentRoleBaseSections[normalized];

  if (budgetDepartmentBaseSections) {
    return withConditionalBudgetSection(
      role,
      department,
      budgetDepartmentBaseSections,
    );
  }

  return roleSpecificSections[normalized] ?? null;
}

export function getSidebarForRole(
  role?: string | null,
  adminLevel?: string | null,
  department?: string | null,
): RoleSidebar {
  const dashboard = getDashboardForRole(role);
  const specificSections = getRoleSpecificSections(role, department);

  return {
    title: "",
    icon: dashboard.icon,
    adminLevel,
    sections: specificSections ?? sections,
  };
}

function isSuperAdminRole(role?: string | null) {
  const normalized = normalizeRoleForSidebar(role);

  return ["super-admin", "superadmin", "super-admin-role"].includes(normalized);
}

function allowedByPermission(
  permission: string | undefined,
  permissions: string[],
  isSuperAdmin = false,
) {
  if (isSuperAdmin) return true;
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
  isSuperAdmin = false,
) {
  if (isSuperAdmin) return true;
  if (item.superOnly) return false;
  if (!item.levels?.length) return true;

  return item.levels.includes(String(adminLevel ?? "") as AdminLevel);
}

export function filterSidebarByPermissions(
  roleSidebar: RoleSidebar,
  permissions: string[] = [],
  role?: string | null,
) {
  const isSuperAdmin = isSuperAdminRole(role);

  return roleSidebar.sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          const children = item.children?.filter(
            (child) =>
              allowedByPermission(
                child.permission,
                permissions,
                isSuperAdmin,
              ) && allowedByLevel(child, roleSidebar.adminLevel, isSuperAdmin),
          );

          if (item.children) {
            return children?.length ? { ...item, children } : null;
          }

          return allowedByPermission(
            item.permission,
            permissions,
            isSuperAdmin,
          ) && allowedByLevel(item, roleSidebar.adminLevel, isSuperAdmin)
            ? item
            : null;
        })
        .filter(Boolean) as SidebarItem[],
    }))
    .filter((section) => section.items.length > 0);
}
