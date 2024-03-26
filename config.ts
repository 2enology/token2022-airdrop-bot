import "dotenv/config";

export const config = {
  PORT: process.env.PORT || 27017,
  NODE_ENV: process.env.NODE_ENV,
  // Should use some paid RPC. Used free one for test case
  // Should use some paid RPC. Used free one for test case
  SOLANA_RPC_URL:
    "https://devnet.helius-rpc.com/?api-key=7b018084-0181-4c17-af0e-799dd86f3b2f",
  SOL_VAULT_WALLET: "J4cxCdTpQdHUeiVUEETTNFXvd51E8QZrDk4cYjRYJTYE", // BE Sol Vault wallet address
  SOLANA_PRIVATE: "", // BE Sol Vault wallet privatekey
  SOL_TOKEN_ADDRESS: "AXA9R2HSPCGx1X3QPZU2RHDiDnbD1sS8XLTcV5PTdw3m", // Solana Token address
  SOL_TOKEN_DECIMAL: 9, // SOL Token decimal
};
