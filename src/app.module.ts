import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { BotService } from './bot/bot.service';

@Module({
  controllers: [AppController],
  providers: [BotService],
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot()],
})
export class AppModule {}
