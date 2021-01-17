import { Injectable } from '@nestjs/common';

@Injectable()
export class BotService {
  botMessage() {
    // eslint-disable-next-line
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

    bot.on('message', (msg) => {
      bot.sendMessage(msg.from.id, `Привет, ${msg.from.first_name}!`);
    });
  }
}
