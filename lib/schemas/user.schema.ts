import { z } from "zod";
import type {
  AdminLevel,
  CreateUserPayload,
  UpdateUserPayload,
} from "@/types/user-management/user.type";

/**
 * Converts empty values to null and parses numeric values safely
 */
const nullableNumber = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === undefined ||
      value === null ||
      value === "none"
    ) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  },
  z.number().int().positive().nullable().optional()
);

/**
 * Allowed admin levels
 */
export const adminLevels = [
  "city",
  "subcity",
  "woreda",
  "zone",
] as const;

export const professionalLevels = ["III", "IV"] as const;


function normalizeRole(role?: string | null) {
  return (role || "").toLowerCase().trim();
}

const allowedUserManagementRoles = [
  "super admin",
  "manager",
  "head of development branch",
  "head of service branch",
  "team leader",
  "expert",
  "secretory",
  "accountant",
  "record officer",
];

function isOfficeDepartmentUserRole(role?: string | null) {
  return allowedUserManagementRoles.includes(normalizeRole(role));
}

/**
 * Validation shape
 */
type ScopeShape = {
  role?: string;
  admin_level?: AdminLevel | null;
  office_id?: number | null;
  sub_city_id?: number | null;
  woreda_id?: number | null;
  zone_id?: number | null;
  professional_level?: "III" | "IV" | null;
};

/**
 * Dynamic validation based on admin level
 */
function validateAdminScope(
  value: ScopeShape,
  ctx: z.RefinementCtx
) {
  if (!value.office_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["office_id"],
      message: "Office is required",
    });
  }

  if (isOfficeDepartmentUserRole(value.role)) {
    return;
  }

  if (!value.office_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["office_id"],
      message: "Office is required",
    });
  }

  if (!value.admin_level) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["admin_level"],
      message: "Admin level is required",
    });
  }

  if (value.admin_level === "city" && !value.office_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["office_id"],
      message: "City is required",
    });
  }

  if (value.admin_level === "subcity" && !value.sub_city_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sub_city_id"],
      message: "Subcity is required",
    });
  }

  if (value.admin_level === "woreda" && !value.woreda_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["woreda_id"],
      message: "Woreda is required",
    });
  }

  if (value.admin_level === "zone" && !value.zone_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["zone_id"],
      message: "Zone is required",
    });
  }
}

/**
 * Common schema
 *
 * IMPORTANT:
 * Removed hardcoded z.enum([...])
 * User management allows only the configured office/department roles.
 */
const common = {
  name: z
    .string()
    .trim()
    .min(2, "Name is required")
    .max(100),

  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .max(100),

  phone: z
    .string()
    .trim()
    .min(6, "Phone is required")
    .max(20),

  /**
   * Dynamic role support
   */
  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(100),

  admin_level: z
    .enum(adminLevels)
    .nullable()
    .optional(),

  address: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),

  office_id: nullableNumber,
  department_id: nullableNumber,
  sub_city_id: nullableNumber,
  woreda_id: nullableNumber,
  zone_id: nullableNumber,
  professional_level: z.enum(professionalLevels).nullable().optional(),
  signature: z.any().nullable().optional(),
  stamp: z.any().nullable().optional(),
  titer: z.any().nullable().optional(),
};

/**
 * Create user validation
 */
export const createUserSchema = z
  .object({
    ...common,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(255),
  })
  .superRefine(validateAdminScope) as unknown as z.ZodType<CreateUserPayload>;

/**
 * Update user validation
 */
export const updateUserSchema = z
  .object(common)
  .superRefine(validateAdminScope) as unknown as z.ZodType<UpdateUserPayload>;

/**
 * Password reset validation
 */
export const resetUserPasswordSchema = z.object({
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255),
});