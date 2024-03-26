import { PublicKey } from "@solana/web3.js";

export interface Data {
  receiver: PublicKey;
  amount: number;
  signature: string | null | undefined;
}
