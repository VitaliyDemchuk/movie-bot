import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
