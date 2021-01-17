import { Injectable } from '@nestjs/common';
import axios from 'axios';
// eslint-disable-next-line
const _ = require('lodash');

@Injectable()
export class BotService {
  public bot: any = null;

  onApplicationBootstrap() {
    this.initialize();
  }

  initialize() {
    // eslint-disable-next-line
    const TelegramBot = require('node-telegram-bot-api');
    this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

    axios.defaults.baseURL = 'https://api.themoviedb.org/3';
    axios.defaults.params = {};
    axios.defaults.params.api_key = process.env.MOVIEDB_TOKEN;
    axios.defaults.params.language = 'ru';

    this.test();
  }

  test() {
    this.bot.on('message', async (msg: any) => {
      const movie = await this.searchMovies(msg.text);
      let markdown = ``;

      if (!movie) {
        markdown = `Информация о фильме не найдена`;
      } else {
        markdown = `*${_.get(movie, 'title')}*\n`;
        movie.videos.forEach((v: any) => {
          markdown += `▶️ [Смотреть тизер](https://youtu.be/${v.key})\n`;
        });
        if (_.get(movie, 'vote_average')) {
          markdown += `⭐ ${movie.vote_average}`;
        }
      }

      this.bot.sendMessage(msg.from.id, markdown, {
        parse_mode: 'markdown',
      });
    });
  }

  async searchMovies(search: string) {
    try {
      const result = await axios({
        url: `/search/movie`,
        method: 'GET',
        params: { query: search },
      });

      const movie = _.get(result.data, `results.0`);
      if (movie) {
        const resultVideos = await axios.get(`/movie/${movie.id}/videos`);
        movie.videos =
          _.filter(_.get(resultVideos.data, 'results'), (item: any) =>
            ['Trailer', 'Teaser'].includes(_.get(item, 'type')),
          ) || [];
      }

      return Promise.resolve(movie);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
