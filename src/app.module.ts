import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BotService } from './bot/bot.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AppController],
  providers: [BotService],
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
