import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

import axios from 'axios';
// eslint-disable-next-line
const _ = require('lodash');

const KEYBOARD_COMMAND_POPULAR_MOVIES = '🎦 Популярные фильмы';
const KEYBOARD_COMMAND_NOW_PLAYING_MOVIES = '🍿 Сейчас смотрят';
const COMMAND_PREVIOS_PAGE = 'prev';
const COMMAND_NEXT_PAGE = 'next';

@Injectable()
export class BotService {
  public bot: any = null;
  public commands: any = null;

  constructor(private readonly UserService: UserService) {
    this.initialize();
    this.registerListeners();
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

  registerListeners() {
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
          from: { id: userId },
        } = msg;

        this.bot.sendMessage(
          id,
          `🔎 Выполняется поиск, пожалуйста, подождите...`,
        );

        const { markdown, inline_keyboard } = await this.getMoviesMsg(
          'popular',
          userId,
        );
        this.bot.sendMessage(id, markdown, {
          parse_mode: 'markdown',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard,
          },
        });
      },
    );

    this.bot.onText(
      new RegExp(KEYBOARD_COMMAND_NOW_PLAYING_MOVIES),
      async (msg: any) => {
        const {
          chat: { id },
          from: { id: userId },
        } = msg;

        this.bot.sendMessage(
          id,
          `🔎 Выполняется поиск, пожалуйста, подождите...`,
        );

        const { markdown, inline_keyboard } = await this.getMoviesMsg(
          'now_playing',
          userId,
        );
        this.bot.sendMessage(id, markdown, {
          parse_mode: 'markdown',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard,
          },
        });
      },
    );

    this.bot.on('callback_query', async (query: any) => {
      try {
        const {
          message: { chat, message_id },
          from: { id: userId },
        } = query;

        const data = JSON.parse(query.data);

        switch (data.t) {
          case COMMAND_NEXT_PAGE:
          case COMMAND_PREVIOS_PAGE:
            const { markdown, inline_keyboard } = await this.getMoviesMsg(
              data.p.t,
              userId,
              { page: data.p.p },
            );
            this.bot.editMessageText(markdown, {
              chat_id: chat.id,
              parse_mode: 'markdown',
              disable_web_page_preview: true,
              message_id,
              reply_markup: {
                inline_keyboard,
              },
            });
            break;
        }

        this.bot.answerCallbackQuery({ callback_query_id: query.id });
      } catch (e) {
        this.bot.answerCallbackQuery({
          callback_query_id: query.id,
          text: e.message,
        });
      }
    });
  }

  async getMoviesMsg(type: string, userId: number, params = { page: 1 }) {
    try {
      const currentUser = await this.UserService.get(userId);
      const viewedMovies = _.get(currentUser, 'viewedMovies', []);

      const movies = await this.getMoviesList(type, params);
      let markdown = ``;

      movies.results.forEach((movie: any) => {
        if (_.get(movie, 'release_date')) {
          const date: Date = new Date(movie.release_date);
          movie.year = `(${date.getFullYear()})`;
        }
        const titleSiteLink = `${movie.title} ${movie.year}`;
        if (!viewedMovies.includes(movie.id)) {
          markdown += `🆕 *${titleSiteLink}*`;
          viewedMovies.push(movie.id);
        } else {
          markdown += `${titleSiteLink}`;
        }

        if (_.get(movie, 'vote_average')) {
          markdown += ` 🔥${movie.vote_average}`;
        }

        if (_.get(movie.videos, 0)) {
          markdown += `\n[📽️ смотреть трейлер](https://youtu.be/${_.get(
            movie.videos,
            '0.key',
          )})`;
        }
        markdown += '\n\n';
      });

      const keyboard = [];
      if (movies.page > 1) {
        keyboard.push({
          text: '⬅️',
          callback_data: JSON.stringify({
            t: COMMAND_PREVIOS_PAGE,
            p: {
              p: movies.page - 1,
              t: type,
            },
          }),
        });
      }
      if (movies.page < movies.total_pages) {
        keyboard.push({
          text: '➡️',
          callback_data: JSON.stringify({
            t: COMMAND_NEXT_PAGE,
            p: {
              p: movies.page + 1,
              t: type,
            },
          }),
        });
      }

      await this.UserService.update({
        id: userId,
        viewedMovies,
      });

      return Promise.resolve({
        markdown,
        inline_keyboard: [keyboard],
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getMoviesList(type = 'popular', params = { page: 1 }) {
    try {
      const result = await axios({
        url: `/movie/${type}`,
        method: 'GET',
        params: { region: 'ru', ...params },
      });
      const movies = await this.getProcessedMovies(
        _.get(result.data, `results`),
      );

      return Promise.resolve({
        ...result.data,
        results: movies,
      });
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
}
