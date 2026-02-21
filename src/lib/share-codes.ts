import { nanoid } from "nanoid";
import { SHARE_CODE_LENGTH } from "./constants";

export function generateShareCode(): string {
  return nanoid(SHARE_CODE_LENGTH);
}
