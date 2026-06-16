import { z } from "zod";

export const permissionSchema = z.object({
  name: z.string().trim().min(3, "Permission name is required").max(120),
});
