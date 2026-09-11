export const PAYMENT_INSTRUCTIONS = {
  accountHolder: "CLEVONE JEAMSON EROISH",
  mpesa: {
    phone: "+243828320130",
    displayPhone: "+243 828 320 130",
  },
  rawbank: {
    swiftBic: "RAWBCDKI",
    accounts: {
      CDF: "15150-00978276003-95",
      USD: "15150-00978276002-01",
    },
  },
} as const;

export type SupportedTransferCurrency = keyof typeof PAYMENT_INSTRUCTIONS.rawbank.accounts;

export function getRawbankAccount(currency: SupportedTransferCurrency): string {
  return PAYMENT_INSTRUCTIONS.rawbank.accounts[currency];
}
