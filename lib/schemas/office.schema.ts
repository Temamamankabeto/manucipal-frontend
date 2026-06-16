import { z } from "zod";
import type { OfficePayload } from "@/types/location/office.type";
const parent = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null || value === "none") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().positive().nullable().optional());
export const officeSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(150),
  code: z.string().trim().max(80).optional().or(z.literal("")),
  type: z.enum(["city", "subcity", "woreda", "zone"]),
  parent_id: parent,
  is_active: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (value.type !== "city" && !value.parent_id) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_id"], message: "Parent location is required" });
});
export const parseOfficePayload = (value: unknown): OfficePayload => officeSchema.parse(value) as OfficePayload;
