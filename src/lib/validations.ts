import { z } from "zod";

const requiredString = z.string().trim().min(1, "This field is required");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  password: requiredString.min(8, "Must be at least 8 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: requiredString,
  mediaIds: z.array(z.string()).max(4, "Cannot have more than 4 attachments"),
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().trim().min(1, "This field is required"),
  bio: z.string().max(1000, " Must be less than 1000 characters"),
});
export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const createCommentSchema = z.object({
  content: requiredString,
});
