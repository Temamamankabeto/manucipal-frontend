import { z } from "zod";

export const roleSchema = z.object({
  name: z.enum(["Super Admin", "Admin","Asset Manager","Store Keeper","Department Head","Maintenance Officer","Disposal Committee"]),
});
