import { Injectable, OnModuleInit } from '@nestjs/common';
import { BitvavoService } from './bitvavo/bitvavo.service';
import { CronJob } from 'cron';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

interface IBuyConfigEntry {
  market: string;
  amount?: number;
  amountQuote?: number;
  cron: string;
}

interface IWithdrawConfigEntry {
  symbol: string;
  cron: string;
  address: string;
}

const BUY_CONFIG: IBuyConfigEntry[] = [
  { market: 'ETH-EUR', amountQuote: 15, cron: '1 1 * * MON' },
  // { market: 'ETH-EUR', amountQuote: 15, cron: '* * * * *' },
];

const WITHDRAWAL_CONFIG: IWithdrawConfigEntry[] = [
  {
    symbol: 'ETH',
    cron: '1 1 * * TUE',
    address: '0x9b41030A0A009c4025bdEBe1b44Fa4b2AA1bdf54',
  },
];

function createBuyConfigCronName(buyConfig: IBuyConfigEntry): string {
  return `market=${buyConfig.market}-amount=${buyConfig.amount}-amountQuote=${buyConfig.amountQuote}-cron=${buyConfig.cron}`;
}

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly bitvavoService: BitvavoService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.bitvavoService = bitvavoService;
  }

  async onModuleInit(): Promise<void> {
    const buyConfigCheck = await this.verifyBuyConfig(BUY_CONFIG);

    if (!buyConfigCheck) {
      console.error('Buy Config invalid!');

      return;
    }

    for (const buyConfig of BUY_CONFIG) {
      this.addBuyJob(buyConfig);
    }

    for (const withdrawConfig of WITHDRAWAL_CONFIG) {
      this.addWithdrawJob(withdrawConfig);
    }

    this.listCronjobs();
  }

  @Cron('* * * * *', { name: 'listCronjobs' })
  listCronjobs() {
    const jobs = this.schedulerRegistry.getCronJobs();

    jobs.forEach((value, key, map) => {
      let next;

      try {
        next = value.nextDates().toString();
      } catch (e) {
        next = 'error: next fire date is in the past!';
      }

      console.log(`job: ${key} -> next: ${next}`);
    });
  }

  addBuyJob(buyConfig: IBuyConfigEntry): void {
    const job = new CronJob(buyConfig.cron, () =>
      this.executeBuyJob(buyConfig),
    );

    this.schedulerRegistry.addCronJob(createBuyConfigCronName(buyConfig), job);

    job.start();
  }

  addWithdrawJob(withdrawConfig: IWithdrawConfigEntry): void {
    const job = new CronJob(withdrawConfig.cron, () =>
      this.executeWithdrawJob(withdrawConfig),
    );

    this.schedulerRegistry.addCronJob(
      `symbol=${withdrawConfig.symbol}-cron=${withdrawConfig.cron}`,
      job,
    );

    job.start();
  }

  async verifyBuyConfig(buyConfigs: IBuyConfigEntry[]): Promise<boolean> {
    const assets = await this.bitvavoService.assets();
    const markets = await this.bitvavoService.markets();
    let success = true;

    for (const buyConfig of buyConfigs) {
      const [symbol1, symbol2] = buyConfig.market.split('-');
      const asset1 = assets.find(({ symbol }) => symbol === symbol1);
      const asset2 = assets.find(({ symbol }) => symbol === symbol2);

      if (!asset1 || !asset2) {
        success = false;

        console.error(
          'verifyBuyConfig asset not found',
          symbol1,
          asset1,
          symbol2,
          asset2,
        );

        break;
      }

      const market = markets.find(({ market }) => market === buyConfig.market);

      if (!market) {
        success = false;

        console.error('verifyBuyConfig market not found', buyConfig.market);

        break;
      }

      if (!buyConfig.amount && !buyConfig.amountQuote) {
        success = false;

        console.error(
          'verifyBuyConfig amount or amountQuote required',
          buyConfig,
        );

        break;
      }
    }

    return success;
  }

  async executeBuyJob(buyConfig: IBuyConfigEntry): Promise<boolean> {
    const openOrders = await this.bitvavoService.openOrders(buyConfig.market);

    if (openOrders.length > 0) {
      console.log('executeBuyJob: Order open for Market', buyConfig.market);

      return false;
    }

    const [symbol1, symbol2] = buyConfig.market.split('-');

    const [balance] = await this.bitvavoService.balance(symbol2);

    if (buyConfig.amountQuote) {
      if (buyConfig.amountQuote >= Number(balance.available)) {
        console.log(
          'executeBuyJob: Not enough balance for Order',
          balance,
          buyConfig.amountQuote,
        );

        return false;
      }

      try {
        await this.bitvavoService.createMarketBuyOrderWithAmountQuote(
          buyConfig.market,
          buyConfig.amountQuote,
        );

        return true;
      } catch (e) {
        console.error('executeBuyJob: failed to execute order', e);
      }
    } else if (buyConfig.amount) {
      // TODO
      console.log('not implemented');
    }

    return false;
  }

  async executeWithdrawJob(
    withdrawConfig: IWithdrawConfigEntry,
  ): Promise<boolean> {
    try {
      await this.bitvavoService.withdrawAll(
        withdrawConfig.symbol,
        withdrawConfig.address,
      );

      return true;
    } catch (e) {
      console.error('executeWithdrawJob: failed to create withdrawal', e);
    }

    return false;
  }
}