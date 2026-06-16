import { z } from "zod";

export const citizenSchema = z.object({
  national_id: z.string().trim().min(1, "National ID is required"),
  first_name: z.string().trim().min(1, "First name is required"),
  middle_name: z.string().trim().optional().or(z.literal("")),
  last_name: z.string().trim().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other"]),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  place_of_birth: z.string().trim().optional().or(z.literal("")),
  nationality: z.string().trim().min(1, "Nationality is required"),
  marital_status: z.string().optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  occupation: z.string().trim().optional().or(z.literal("")),
  education_level: z.string().trim().optional().or(z.literal("")),
  disability_status: z.boolean().optional(),
  emergency_contact: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(1, "Address is required"),
  house_number: z.string().trim().optional().or(z.literal("")),
  photo: z.any().optional(),
});
