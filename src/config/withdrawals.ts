export interface IWithdrawConfigEntry {
  symbol: string;
  cron: string;
  address: string;
}

export const WITHDRAWAL_CONFIG: IWithdrawConfigEntry[] = [
  {
    symbol: 'ETH',
    cron: '1 2 * * *',
    address: '0x9b41030A0A009c4025bdEBe1b44Fa4b2AA1bdf54',
  },
];
