import type { Street } from "@holdem/poker-engine";

export function shouldStartShowdownPresentation(street: Street): boolean {
  return street === "showdown";
}
