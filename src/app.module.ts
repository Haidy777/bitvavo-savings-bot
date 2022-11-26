import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { BitvavoService } from './bitvavo/bitvavo.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.development.local'],
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [AppService, BitvavoService],
})
export class AppModule {}
