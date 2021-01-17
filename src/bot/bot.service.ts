import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
// import { UserService } from '../user/user.service';

import axios from 'axios';
// eslint-disable-next-line
const _ = require('lodash');

@Injectable()
export class BotService {
  public bot: any = null;

  // constructor(private readonly UserService: UserService) { }

  onApplicationBootstrap() {
    console.log('test');
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

  // TODO: customize
  @Cron('0 00 18 * * *')
  handleCron() {
    this.getLatestMovies();
  }

  // TODO: remove
  test() {
    this.bot.on('message', async (msg: any) => {
      const userId = msg.from.id;

      this.bot.sendMessage(
        userId,
        '🔎 Выполняется поиск, пожалуйста, подождите...',
      );

      // await this.UserService.create({ id: userId });
      // const result = this.UserService.findAll();
      // console.log(result);

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

  async getLatestMovies() {
    try {
      // TODO: remove
      // const chatId = '81465442';
      const chatId = '';

      const result = await axios({
        url: `/movie/popular`,
        method: 'GET',
        params: { region: 'ru' },
      });

      const movies = await this.getProcessedMovies(
        _.get(result.data, `results`, []).filter(
          (el) => el.vote_average >= 5.5,
        ),
      );

      movies.forEach((movie: any) => {
        this.sendPost(chatId, movie);
      });
    } catch (e) {
      Promise.reject(e);
    }
  }

  async searchMovies(search: string) {
    try {
      const result = await axios({
        url: `/search/movie`,
        method: 'GET',
        params: { query: search },
      });

      const movies = await this.getProcessedMovies(
        _.get(result.data, `results`),
      );

      return Promise.resolve(movies);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getProcessedMovies(items: any) {
    try {
      const movies = _.cloneDeep(items) || [];
      for (const movie of movies) {
        movie.videos = await this.getMovies(movie.id);
      }
      return Promise.resolve(movies);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getMovies(id: number) {
    try {
      const resultVideos = await axios.get(`/movie/${id}/videos`);
      const videos =
        _.filter(_.get(resultVideos.data, 'results'), (item: any) =>
          ['Trailer', 'Teaser'].includes(_.get(item, 'type')),
        ) || [];
      return Promise.resolve(videos);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  sendPost(chatId: string, movie: any) {
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
