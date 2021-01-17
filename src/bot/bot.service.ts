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

  // TODO: remove
  test() {
    this.bot.on('message', async (msg: any) => {
      this.bot.sendMessage(
        msg.from.id,
        '🔎 Выполняется поиск, пожалуйста, подождите...',
      );

      const movies = await this.searchMovies(msg.text);
      if (!_.get(movies, 'length')) {
        this.bot.sendMessage(msg.from.id, 'Информация о фильме не найдена');
      } else {
        movies.forEach((movie: any) => {
          this.sendPost(msg.from.id, movie);
        });
      }
    });
  }

  async searchMovies(search: string) {
    try {
      const result = await axios({
        url: `/search/movie`,
        method: 'GET',
        params: { query: search },
      });

      const movies = _.get(result.data, `results`) || [];

      for (const movie of movies) {
        const resultVideos = await axios.get(`/movie/${movie.id}/videos`);
        movie.videos =
          _.filter(_.get(resultVideos.data, 'results'), (item: any) =>
            ['Trailer', 'Teaser'].includes(_.get(item, 'type')),
          ) || [];
      }

      return Promise.resolve(movies);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  sendPost(chatId, movie) {
    let markdown = ``;

    if (_.get(movie, 'release_date')) {
      const date: Date = new Date(movie.release_date);
      movie.year = `(${date.getFullYear()})`;
    }
    markdown = `*${movie.title} ${movie.year}*\n`;
    if (movie.overview) {
      markdown += `${movie.overview}\n`;
    }
    movie.videos.forEach((v: any) => {
      const name =
        typeof v.name === 'string'
          ? v.name.replace(/\[|\]|\(|\)/g, '')
          : 'Тизер';
      markdown += `📺 [${name}](https://youtu.be/${v.key})\n`;
    });
    if (_.get(movie, 'vote_average')) {
      markdown += `⭐ ${movie.vote_average}`;
    }

    this.bot.sendMessage(chatId, markdown, {
      parse_mode: 'markdown',
    });
  }
}
