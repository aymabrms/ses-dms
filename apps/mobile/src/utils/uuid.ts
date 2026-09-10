import * as Crypto from "expo-crypto";

export function createUuid() {
  return Crypto.randomUUID();
}
