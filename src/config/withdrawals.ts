export interface IWithdrawConfigEntry {
  symbol: string;
  cron: string;
  address: string;
}

export const WITHDRAWAL_CONFIG: IWithdrawConfigEntry[] = [
  {
    symbol: 'ETH',
    cron: '1 1 * * TUE',
    address: '0x9b41030A0A009c4025bdEBe1b44Fa4b2AA1bdf54',
  },

  {
    symbol: 'DOT',
    cron: '1 1 * * TUE',
    address: '15twEe9iUMXwwCwavGA5Ja9tiGxffBV1DcSKomqkGn7XtrCq',
  },

  {
    symbol: 'NEAR',
    cron: '1 1 * * TUE',
    address: '92598ffa91508ec62b827aae60691c34c4cfb2dcba83b16acd4380ce16856110',
  },
];
