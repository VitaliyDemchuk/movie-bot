import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

import axios from 'axios';
// eslint-disable-next-line
const _ = require('lodash');

const KEYBOARD_COMMAND_POPULAR_MOVIES = '🎦 Популярные фильмы';
const KEYBOARD_COMMAND_NOW_PLAYING_MOVIES = '🍿 Сейчас смотрят';

@Injectable()
export class BotService {
  public bot: any = null;
  public commands: any = null;

  constructor(private readonly UserService: UserService) {
    this.initialize();
    this.registerOnMessageListener();
  }

  initialize() {
    axios.defaults.baseURL = 'https://api.themoviedb.org/3';
    axios.defaults.params = {};
    axios.defaults.params.api_key = process.env.MOVIEDB_TOKEN;
    axios.defaults.params.language = 'ru';

    // eslint-disable-next-line
    const TelegramBot = require('node-telegram-bot-api');
    this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
  }

  initializeKeyboard(id: number, text: string) {
    this.bot.sendMessage(id, text, {
      reply_markup: {
        keyboard: [
          [
            KEYBOARD_COMMAND_POPULAR_MOVIES,
            KEYBOARD_COMMAND_NOW_PLAYING_MOVIES,
          ],
        ],
        resize_keyboard: true,
      },
    });
  }

  registerOnMessageListener() {
    this.bot.onText(/\/start/, async (msg: any) => {
      const {
        chat: { id },
      } = msg;

      await this.UserService.create({
        id,
        viewedMovies: [],
      });
      this.initializeKeyboard(
        id,
        `🤖 Здравствуйте. Я создан чтобы вы могли узнать о новых и популярных фильмах.`,
      );
    });

    this.bot.onText(
      new RegExp(KEYBOARD_COMMAND_POPULAR_MOVIES),
      async (msg: any) => {
        const {
          chat: { id },
        } = msg;
        this.sendMovies(id, 'popular');
        this.initializeKeyboard(
          id,
          `🔎 Выполняется поиск, пожалуйста, подождите...`,
        );
      },
    );

    this.bot.onText(
      new RegExp(KEYBOARD_COMMAND_NOW_PLAYING_MOVIES),
      async (msg: any) => {
        const {
          chat: { id },
        } = msg;
        this.sendMovies(id, 'now_playing');
        this.initializeKeyboard(
          id,
          `🔎 Выполняется поиск, пожалуйста, подождите...`,
        );
      },
    );
  }

  async sendMovies(id: number, type: string) {
    try {
      const moviesList = await this.getMoviesList(type);

      const currentUser = await this.UserService.get(id);
      if (currentUser) {
        const viewedMovies = currentUser.viewedMovies || [];
        let emptyResult = true;

        moviesList.forEach((movie: any) => {
          if (!viewedMovies.includes(movie.id)) {
            this.sendPost(id, movie);
            viewedMovies.push(movie.id);
            emptyResult = false;
          }
        });

        await this.UserService.update({
          id: id,
          viewedMovies,
        });

        if (emptyResult) {
          this.bot.sendMessage(id, '😿 Новых фильмов не обнаружено');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async getMoviesList(type = 'popular', voteMore = 5.5) {
    try {
      const result = await axios({
        url: `/movie/${type}`,
        method: 'GET',
        params: { region: 'ru' },
      });

      const movies = await this.getProcessedMovies(
        _.get(result.data, `results`, []).filter(
          (el) => el.vote_average >= voteMore && el.adult === false,
        ),
      );

      return Promise.resolve(movies);
    } catch (e) {
      Promise.reject(e);
    }
  }

  async getProcessedMovies(items: any) {
    try {
      const movies = _.cloneDeep(items) || [];

      const queries = [];
      for (const movie of movies) {
        queries.push(this.getMovieVideos(movie.id));
      }
      const resultVideo = await Promise.all(queries);

      for (const [key] of Object.entries(movies)) {
        movies[key].videos = resultVideo[key];
      }
      return Promise.resolve(movies);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getMovieVideos(id: number) {
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

  sendPost(chatId: number, movie: any) {
    let markdown = ``;

    if (_.get(movie, 'release_date')) {
      const date: Date = new Date(movie.release_date);
      movie.year = `(${date.getFullYear()})`;
    }

    let titleHideLink = `📺`;
    if (_.get(movie.videos, 0)) {
      titleHideLink = `[📺](https://youtu.be/${_.get(movie.videos, '0.key')})`;
    } else if (movie.poster_path) {
      titleHideLink = `[📺](https://image.tmdb.org/t/p/w500${movie.poster_path})`;
    }
    const titleSiteLink = `[${movie.title} ${movie.year}](https://www.themoviedb.org/movie/${movie.id})`;
    markdown = `${titleHideLink} ${titleSiteLink}\n`;

    if (_.get(movie, 'vote_average')) {
      markdown += `⭐ ${movie.vote_average}\n`;
    }

    this.bot.sendMessage(chatId, markdown, {
      parse_mode: 'markdown',
    });
  }
}
