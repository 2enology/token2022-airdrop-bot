export const ValidateWalletPublicKey = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
