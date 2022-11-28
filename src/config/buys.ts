export interface IBuyConfigEntry {
  market: string;
  amount?: number;
  amountQuote?: number;
  cron: string;
}

export const BUY_CONFIG: IBuyConfigEntry[] = [
  { market: 'ETH-EUR', amountQuote: 15, cron: '1 1 * * MON' },
  { market: 'DOT-EUR', amountQuote: 15, cron: '1 1 * * MON' },
  { market: 'NEAR-EUR', amountQuote: 15, cron: '1 1 * * MON' },
];