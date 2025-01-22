import * as notification_types from "./notification_types";
import * as schemas from "./schemas";

export function JSONtoString(obj: any): string {
  return JSON.stringify(obj, (_, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
}

export { schemas, notification_types };
