import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Invalid email.")
  .max(128, "Email must be less than 128 characters.");

export const usernameSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9-_]+$/,
    "Username must only contain letters, numbers, dashes, and underscores."
  )
  .max(18, "Username must be at most 18 characters.")
  .min(3, "Username must at least 3 characters.");

export const displayNameSchema = z
  .string()
  .regex(/^[^\s].*$/, "Display name must not start with a space.")
  .max(24, "Display name must be less than 24 characters.")
  .min(2, "Display name must be at least 2 characters.");

export const occupationSchema = z
  .string()
  .max(32, "Occupation must be less than 32 characters.")
  .optional();

export const locationSchema = z
  .string()
  .max(32, "Location must be less than 32 characters.")
  .optional();

export const pronounsSchema = z
  .string()
  .max(12, "Pronouns must be less than 12 characters.")
  .optional();

export const websiteSchema = z
  .string()
  .url("Invalid URL.")
  .max(128, "Website must be less than 128 characters.")
  .optional();

export const passwordSchema = z
  .string()
  .min(8, "Password must be more than 8 characters.")
  .max(128, "Password must be less than 128 characters.");

export const postBodySchema = z
  .string()
  .min(1, "A post must be more than 1 characters.")
  .max(300, "A post must be less than 300 characters.");

export const ribbonBodySchema = z
  .string()
  .min(1, "A ribbon message must be more than 1 characters.")
  .max(30, "A ribbon message must be less than 30 characters.");

export const supportRequestBodySchema = z
  .string()
  .min(5, "Must be more than 5 characters.")
  .max(1000, "Must be less than 1000 characters.");

export const chatMessageSchema = z
  .string()
  .min(1, "A message must be at least 1 character.")
  .max(2000, "A chat message must be at most 2000 characters.");

export const articleSlugSchema = z
  .string()
  .regex(
    /^[a-z0-9-]+$/,
    "Article slug must only contain lower case letters, numbers and dashes."
  )
  .regex(/^[a-z]/, "Article slug must contain at least one letter.")
  .max(62, "Article slug must be at most 62 characters.")
  .min(3, "Article slug must be at least 3 characters.");

export const articleTitleSchema = z
  .string()
  .max(80, "Article title must be at most 80 characters.")
  .min(3, "Article title must be at least 3 characters.");
