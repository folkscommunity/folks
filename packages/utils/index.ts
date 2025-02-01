import * as notification_types from "./notification_types";
import * as schemas from "./schemas";

export function JSONtoString(obj: any): string {
  return JSON.stringify(obj, (_, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
}

export const restricted_usernames = [
  "discord",
  "admin",
  "manifest",
  "privacy-policy",
  "bug",
  "legal",
  "root",
  "support",
  "help",
  "invite",
  "register",
  "login",
  "verify",
  "reset",
  "reset-password",
  "resend-email",
  "settings",
  "preferences",
  "rokita",
  "folks",
  "community",
  "product",
  "people",
  "design",
  "engineer",
  "founders",
  "company",
  "org",
  "organization",
  "team",
  "non-profit",
  "nonprofit",
  "foundation",
  "charity",
  "donor",
  "donate",
  "fund",
  "funding",
  "stats",
  "statistics",
  "analytics",
  "metrics",
  "dashboard",
  "reports",
  "ios",
  "android",
  "app",
  "apps",
  "api",
  "health"
];

export { schemas, notification_types };
