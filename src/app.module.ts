import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { BitvavoService } from './bitvavo/bitvavo.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { Logger } from './logger/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.development.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  providers: [AppService, BitvavoService, Logger],
})
export class AppModule {}
