import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Invalid email.")
  .max(128, "Email must be less than 128 characters.");

export const usernameSchema = z
  .string()
  .max(12, "Username must be less than 12 characters.")
  .min(4, "Username must be more than 4 characters.");

export const displayNameSchema = z
  .string()
  .max(50, "Display name must be less than 50 characters.")
  .min(4, "Display name must be more than 4 characters.");

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
