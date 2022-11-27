import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class Logger extends ConsoleLogger implements LoggerService {
  webhookUrl = '';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.httpService = httpService;
    this.configService = configService;

    this.webhookUrl = configService.get<string>('SLACK_WEBHOOK_URL');
  }

  log(message: any, context?: string): void {
    super.log(message, context);

    if (this.webhookUrl) {
      firstValueFrom(
        this.httpService.post(this.webhookUrl, {
          text: `${message}${context ? `\n${context}` : ''}`,
        }),
      )
        .then((response) => {
          console.info('Logged to Slack', response.data);
        })
        .catch((err) => {
          console.error('Failed to send log to Slack', err);
        });
    }
  }

  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);

    this.log(message, JSON.stringify({ stack, context }));
  }

  warn(message: any, context?: string) {
    super.warn(message, context);

    this.log(message, context);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);

    this.log(message, context);
  }

  verbose(message: any, context?: string) {
    super.verbose(message, context);

    this.log(message, context);
  }
}
