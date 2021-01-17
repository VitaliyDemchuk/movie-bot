import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
// import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from './user/user.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    // MongooseModule.forRoot(
    //   `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@telegram.94vdj.mongodb.net/bot`,
    // ),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    // UserModule,
    BotModule,
  ],
})
export class AppModule { }
