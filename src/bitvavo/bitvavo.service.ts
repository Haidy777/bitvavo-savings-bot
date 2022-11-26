import { Injectable } from '@nestjs/common';
import * as bitvavo from 'bitvavo';
import { ConfigService } from '@nestjs/config';

interface IBalanceResponseEntry {
  symbol: string;
  available: string;
  inOrder: string;
}

interface IWithdrawResponse {
  success: boolean;
  symbol: string;
  amount: string;
}

interface IMarketResponseEntry {
  market: string;
  status: string;
  base: string;
  quote: string;
  pricePrecision: string;
  minOrderInQuoteAsset: string;
  minOrderInBaseAsset: string;
  orderTypes: string[];
}

interface IAssetResponseEntry {
  symbol: string;
  name: string;
  decimals: number;
  depositFee: string;
  depositConfirmations: number;
  depositStatus: string;
  withdrawalFee: string;
  withdrawalMinAmount: string;
  withdrawalStatus: string;
  networks: string[];
  message: string;
}

@Injectable()
export class BitvavoService {
  private bitvavo;

  constructor(private readonly configService: ConfigService) {
    this.configService = configService;

    this.bitvavo = bitvavo().options({
      APIKEY: configService.get('API_KEY'),
      APISECRET: configService.get('API_SECRET'),
      ACCESSWINDOW: 10000,
      RESTURL: 'https://api.bitvavo.com/v2',
      WSURL: 'wss://ws.bitvavo.com/v2/',
      DEBUGGING: configService.get('IS_DEVELOPMENT'),
    });
  }

  async time(): Promise<number> {
    const { time } = await this.bitvavo.time();

    return time;
  }

  balance(symbol = ''): Promise<IBalanceResponseEntry[]> {
    return this.bitvavo.balance({ symbol });
  }

  withdraw(
    symbol: string,
    amount: number,
    address: string,
  ): Promise<IWithdrawResponse> {
    return this.bitvavo.withdrawAssets(symbol, amount.toString(), address);
  }

  async withdrawAll(
    symbol: string,
    address: string,
  ): Promise<IWithdrawResponse | false> {
    const [balance] = await this.balance(symbol);

    const balanceNum = Number(balance.available);

    if (balanceNum > 0) {
      return this.withdraw(symbol, parseFloat(balance.available), address);
    }

    return false;
  }

  markets(): Promise<IMarketResponseEntry[]> {
    return this.bitvavo.markets();
  }

  assets(): Promise<IAssetResponseEntry[]> {
    return this.bitvavo.assets();
  }

  openOrders(market = ''): Promise<any> {
    return this.bitvavo.ordersOpen({ market });
  }

  createMarketBuyOrderWithAmountQuote(market: string, amountQuote: number) {
    return this.bitvavo.placeOrder(market, 'buy', 'market', { amountQuote });
  }

  //let response = await bitvavo.placeOrder('BTC-EUR', 'sell', 'limit', { 'amount': '1', 'price': 3000 })
  //   console.log(response)
}
