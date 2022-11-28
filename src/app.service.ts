import { Injectable, OnModuleInit } from '@nestjs/common';
import { BitvavoService } from './bitvavo/bitvavo.service';
import { CronJob } from 'cron';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from './logger/logger.service';
import { BUY_CONFIG, IBuyConfigEntry } from './config/buys';
import { IWithdrawConfigEntry, WITHDRAWAL_CONFIG } from './config/withdrawals';

function createBuyConfigCronName(buyConfig: IBuyConfigEntry): string {
  return `buy-market=${buyConfig.market}-amount=${buyConfig.amount}-amountQuote=${buyConfig.amountQuote}-cron=${buyConfig.cron}`;
}

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly bitvavoService: BitvavoService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: Logger,
  ) {
    this.bitvavoService = bitvavoService;
    this.schedulerRegistry = schedulerRegistry;

    this.logger.setContext(AppService.name);
  }

  async onModuleInit(): Promise<void> {
    const buyConfigCheck = await this.verifyBuyConfig(BUY_CONFIG);

    if (!buyConfigCheck) {
      this.logger.error('Buy Config invalid!');

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

  @Cron('1 */6 * * *', { name: 'listCronjobs' })
  listCronjobs() {
    const jobs = this.schedulerRegistry.getCronJobs();

    jobs.forEach((value, key, map) => {
      let next;

      try {
        next = value.nextDates().toString();
      } catch (e) {
        next = 'error: next fire date is in the past!';
      }

      this.logger.log(`${key} -> next: ${next}`);
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
      `withdraw-symbol=${withdrawConfig.symbol}-cron=${withdrawConfig.cron}`,
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

        this.logger.error(
          'verifyBuyConfig asset not found',
          JSON.stringify({
            symbol1,
            asset1,
            symbol2,
            asset2,
          }),
        );

        break;
      }

      const market = markets.find(({ market }) => market === buyConfig.market);

      if (!market) {
        success = false;

        this.logger.error(
          'verifyBuyConfig market not found',
          JSON.stringify({
            market: buyConfig.market,
          }),
        );

        break;
      }

      if (!buyConfig.amount && !buyConfig.amountQuote) {
        success = false;

        this.logger.error(
          'verifyBuyConfig amount or amountQuote required',
          JSON.stringify(buyConfig),
        );

        break;
      }
    }

    return success;
  }

  async executeBuyJob(buyConfig: IBuyConfigEntry): Promise<boolean> {
    const openOrders = await this.bitvavoService.openOrders(buyConfig.market);

    if (openOrders.length > 0) {
      this.logger.log('executeBuyJob: Order open for Market', buyConfig.market);

      return false;
    }

    const [symbol1, symbol2] = buyConfig.market.split('-');

    const [balance] = await this.bitvavoService.balance(symbol2);

    if (buyConfig.amountQuote) {
      if (buyConfig.amountQuote >= Number(balance.available)) {
        this.logger.log(
          'executeBuyJob: Not enough balance for Order',
          JSON.stringify({
            balance,
            amountQuote: buyConfig.amountQuote,
          }),
        );

        return false;
      }

      try {
        const result =
          await this.bitvavoService.createMarketBuyOrderWithAmountQuote(
            buyConfig.market,
            buyConfig.amountQuote,
          );

        this.logger.log('executeBuyJob: Order created', JSON.stringify(result));

        return true;
      } catch (e) {
        this.logger.error('executeBuyJob: failed to execute order', e);
      }
    } else if (buyConfig.amount) {
      // TODO
      this.logger.log('not implemented');
    }

    return false;
  }

  async executeWithdrawJob(
    withdrawConfig: IWithdrawConfigEntry,
  ): Promise<boolean> {
    try {
      const result = await this.bitvavoService.withdrawAll(
        withdrawConfig.symbol,
        withdrawConfig.address,
      );

      this.logger.log(
        'executeWithdrawJob: Withdraw created',
        JSON.stringify(result),
      );

      return true;
    } catch (e) {
      this.logger.error('executeWithdrawJob: failed to create withdrawal', e);
    }

    return false;
  }
}
