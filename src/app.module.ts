import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { UserModule } from './user/user.module';
import { BotModule } from './bot/bot.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@telegram.94vdj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    ),
    ScheduleModule.forRoot(),
    UserModule,
    BotModule,
    TestModule,
  ],
})
export class AppModule {}
