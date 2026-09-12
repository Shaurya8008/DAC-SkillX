import { cn as cnLib } from "cn";

export function cn(...inputs: Parameters<typeof cnLib>) {
  return cnLib(...inputs);
}
