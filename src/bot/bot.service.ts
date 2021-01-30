import { Injectable, UseInterceptors } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserService } from '../user/user.service';
import { SentryInterceptor } from '../sentry.interceptor';

import axios from 'axios';
// eslint-disable-next-line
const _ = require('lodash');

const ENDPOINT_API = 'https://api.themoviedb.org/3';
const ENDPOINT_WEBSITE = 'https://www.themoviedb.org';
const COMMAND_START = '/start';
const COMMAND_MOVIE_DETAIL = '/movie([0-9]+)';
const KEYBOARD_COMMAND_POPULAR_MOVIES = '🎦 Популярно';
const KEYBOARD_COMMAND_NOW_PLAYING_MOVIES = '🍿 Сейчас смотрят';
const KEYBOARD_COMMAND_FAVORITE_MOVIES = '⭐ Избранные';
const KEYBOARD_COMMAND_RECOMENDATION_MOVIES = '📽️ Рекомендации';
const INLINE_COMMAND_PREVIOS_PAGE = 'prev';
const INLINE_COMMAND_NEXT_PAGE = 'next';
const INLINE_COMMAND_FAVORITE_ADD = 'favorite_add';
const INLINE_COMMAND_FAVORITE_DELETE = 'favorite_delete';

@Injectable()
@UseInterceptors(SentryInterceptor)
export class BotService {
  public bot: any = null;
  public commands: any = null;

  constructor(private readonly UserService: UserService) {
    this.initialize();
    this.registerListeners();
  }

  initialize() {
    try {
      axios.defaults.baseURL = ENDPOINT_API;
      axios.defaults.params = {};
      axios.defaults.params.api_key = process.env.MOVIEDB_TOKEN;
      axios.defaults.params.language = 'ru';

      // eslint-disable-next-line
      const TelegramBot = require('node-telegram-bot-api');
      this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    } catch (e) {
      console.error(e);
    }
  }

  initializeKeyboard(id: number, text: string) {
    this.bot.sendMessage(id, text, {
      reply_markup: {
        keyboard: [
          [
            KEYBOARD_COMMAND_POPULAR_MOVIES,
            KEYBOARD_COMMAND_NOW_PLAYING_MOVIES,
          ],
          [
            KEYBOARD_COMMAND_FAVORITE_MOVIES,
            KEYBOARD_COMMAND_RECOMENDATION_MOVIES,
          ],
        ],
        resize_keyboard: true,
      },
    });
  }

  registerListeners() {
    this.bot.onText(new RegExp(COMMAND_START), async (msg: any) => {
      try {
        const {
          chat: { id },
        } = msg;

        await this.UserService.create({
          id,
          viewedMovies: [],
          favoriteMovies: [],
        });
        this.initializeKeyboard(
          id,
          `🤖 Здравствуйте. Я создан чтобы вы могли узнать о популярных фильмах.`,
        );
      } catch (e) {
        console.error(e);
      }
    });

    this.bot.onText(
      new RegExp(KEYBOARD_COMMAND_POPULAR_MOVIES),
      async (msg: any) => {
        try {
          const {
            chat: { id },
            from: { id: userId },
          } = msg;

          const { markdown, inline_keyboard } = await this.getMovieListMsg(
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
        } catch (e) {
          console.error(e);
        }
      },
    );

    this.bot.onText(
      new RegExp(KEYBOARD_COMMAND_NOW_PLAYING_MOVIES),
      async (msg: any) => {
        try {
          const {
            chat: { id },
            from: { id: userId },
          } = msg;

          const { markdown, inline_keyboard } = await this.getMovieListMsg(
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
        } catch (e) {
          console.error(e);
        }
      },
    );

    this.bot.onText(
      new RegExp(KEYBOARD_COMMAND_FAVORITE_MOVIES),
      async (msg: any) => {
        try {
          const {
            chat: { id },
            from: { id: userId },
          } = msg;

          const { markdown, inline_keyboard } = await this.getMovieListMsg(
            '_favorite',
            userId,
          );
          this.bot.sendMessage(id, markdown, {
            parse_mode: 'markdown',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard,
            },
          });
        } catch (e) {
          console.error(e);
        }
      },
    );

    this.bot.onText(
      new RegExp(COMMAND_MOVIE_DETAIL),
      async (msg: any, [prefix, id]) => {
        const {
          chat: { id: chatId },
          from: { id: userId },
        } = msg;

        try {
          if (!id) {
            return;
          }

          const result: any = await Promise.all([
            axios.get(`/movie/${id}`),
            this.getMovieVideos(id),
          ]);
          const movie = {
            ..._.get(result, `0.data`),
            videos: _.get(result, `1`),
          };
          const { markdown, inline_keyboard } = await this.getMovieMsg(
            movie,
            userId,
          );

          this.bot.sendMessage(chatId, markdown, {
            parse_mode: 'markdown',
            reply_markup: {
              inline_keyboard,
            },
          });
        } catch (e) {
          console.error(e.message);
          this.bot.sendMessage(
            chatId,
            `🤖 Извините, произошла непредвиденная ошибка.`,
          );
        }
      },
    );

    this.bot.onText(
      new RegExp(KEYBOARD_COMMAND_RECOMENDATION_MOVIES),
      async (msg: any) => {
        try {
          const {
            from: { id: userId },
          } = msg;
          await this.sendRecomendations(userId);
        } catch (e) {
          console.error(e);
        }
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
          case INLINE_COMMAND_NEXT_PAGE:
          case INLINE_COMMAND_PREVIOS_PAGE:
            const { markdown, inline_keyboard } = await this.getMovieListMsg(
              data.p.t,
              userId,
              {
                page: data.p.p,
              },
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
            this.bot.answerCallbackQuery({ callback_query_id: query.id });
            break;

          case INLINE_COMMAND_FAVORITE_ADD:
          case INLINE_COMMAND_FAVORITE_DELETE:
            const result: any = await Promise.all([
              axios.get(`/movie/${data.p.i}`),
              this.getMovieVideos(data.p.i),
            ]);
            const movie = {
              ..._.get(result, `0.data`),
              videos: _.get(result, `1`),
            };

            // Update user
            const currentUser = await this.UserService.get(userId);
            const favoriteMovies = _.get(currentUser, 'favoriteMovies', []);

            const index = favoriteMovies.indexOf(_.get(movie, 'id'));
            if (data.t === INLINE_COMMAND_FAVORITE_ADD && index === -1) {
              favoriteMovies.push(_.get(movie, 'id'));
            } else if (
              data.t === INLINE_COMMAND_FAVORITE_DELETE &&
              index > -1
            ) {
              favoriteMovies.splice(index, 1);
            }

            await this.UserService.update(
              Object.assign(currentUser, { favoriteMovies }),
            );

            // Update msg
            const {
              markdown: movieMarkdown,
              inline_keyboard: movieKeyboard,
            } = await this.getMovieMsg(movie, userId);

            this.bot.editMessageText(movieMarkdown, {
              chat_id: chat.id,
              parse_mode: 'markdown',
              message_id,
              reply_markup: {
                inline_keyboard: movieKeyboard,
              },
            });
            this.bot.answerCallbackQuery({
              callback_query_id: query.id,
              text:
                data.t === INLINE_COMMAND_FAVORITE_ADD
                  ? 'Добавлено в избранное'
                  : 'Удалено из избранного',
            });
            break;

          default:
            this.bot.answerCallbackQuery({ callback_query_id: query.id });
            break;
        }
      } catch (e) {
        this.bot.answerCallbackQuery({
          callback_query_id: query.id,
          text: e.message,
        });
      }
    });
  }

  @Cron('0 00 20 * * *')
  async sendRecomendations(userId: number) {
    try {
      let users = [];
      if (userId) {
        const user = await this.UserService.get(userId);
        users.push(user);

        if (!_.get(user, 'favoriteMovies.length')) {
          await this.bot.sendMessage(
            userId,
            `🤖 Чтобы получать рекомендации, добавьте фильмы в избранное.`,
          );
          return;
        }
      } else {
        users = await this.UserService.findAll();
      }

      for (const user of users) {
        try {
          if (!_.get(user, 'favoriteMovies.length')) {
            continue;
          }

          let recomendationMsg = '';
          const queries = [];
          const viewedMovies = _.get(user, 'viewedMovies') || [];
          const favoriteMovies = user.favoriteMovies.slice(0, 5);

          for (const favoriteMovieId of favoriteMovies) {
            queries.push(
              axios({
                url: `/movie/${favoriteMovieId}/recommendations`,
                method: 'GET',
                params: { region: 'ru' },
              }),
            );
          }
          const resultList = await Promise.all(queries);

          for (const recomendation of resultList) {
            if (!_.get(recomendation, 'data.results')) {
              continue;
            }
            const filteredRecomendationList = recomendation.data.results
              .filter((m: any) => !viewedMovies.includes(_.get(m, 'id')))
              .slice(0, 4);
            const recomendationList = await this.getProcessedMovies(
              filteredRecomendationList,
            );
            for (const recomendationMovie of recomendationList) {
              if (_.get(recomendationMovie, 'release_date')) {
                const date: Date = new Date(recomendationMovie.release_date);
                recomendationMovie._year = `(${date.getFullYear()})`;
              }
              recomendationMsg += `${recomendationMovie.title} ${recomendationMovie._year}`;

              if (_.get(recomendationMovie, 'vote_average')) {
                recomendationMsg += ` 🔥${recomendationMovie.vote_average}`;
              }

              recomendationMsg += `\nДетали: /movie${recomendationMovie.id}`;

              if (_.get(recomendationMovie.videos, 0)) {
                recomendationMsg += `\nТрейлер: [просмотр](https://youtu.be/${_.get(
                  recomendationMovie.videos,
                  '0.key',
                )})`;
              }

              recomendationMsg += '\n\n';

              viewedMovies.push(recomendationMovie.id);
            }
          }

          if (recomendationMsg) {
            const msg = `*Рекомендации на основе избранных фильмов:*\n\n${recomendationMsg}`;
            await this.UserService.update(
              Object.assign(user, { viewedMovies }),
            );
            await this.bot.sendMessage(user.id, msg, {
              parse_mode: 'markdown',
              disable_web_page_preview: true,
            });
          } else if (userId) {
            await this.bot.sendMessage(
              userId,
              `🤖 Новых рекомендаций не найдено.`,
            );
          }
        } catch (e) {
          console.error(e);
        }
      }

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getMovieMsg(movie: any, userId: number) {
    try {
      let markdown = ``;
      const currentUser = await this.UserService.get(userId);
      const favoriteMovies = _.get(currentUser, 'favoriteMovies', []);
      const isFavorite = favoriteMovies.includes(_.get(movie, 'id'));
      const keyboard: any = [
        {
          text: '🔗 На сайт',
          url: `${ENDPOINT_WEBSITE}/movie/${movie.id}`,
        },
      ];

      // Post keyboard
      if (_.get(movie.videos, '0.key')) {
        keyboard.push({
          text: '🎬 Трейлер',
          url: `https://youtu.be/${_.get(movie.videos, '0.key')}`,
        });
      }
      keyboard.push({
        text: isFavorite ? '✖️ Удалить' : '⭐ В избранное',
        callback_data: JSON.stringify({
          t: isFavorite
            ? INLINE_COMMAND_FAVORITE_DELETE
            : INLINE_COMMAND_FAVORITE_ADD,
          p: {
            i: _.get(movie, 'id'),
          },
        }),
      });

      // Post content
      if (_.get(movie, 'release_date')) {
        const date: Date = new Date(movie.release_date);
        movie._year = `(${date.getFullYear()})`;
      }

      let titleHideLink = ``;
      const titleIcon = isFavorite ? '⭐' : '📺';
      if (_.get(movie.videos, 0)) {
        titleHideLink = `[${titleIcon}](https://youtu.be/${_.get(
          movie.videos,
          '0.key',
        )})`;
      } else if (_.get(movie, 'poster_path')) {
        titleHideLink = `[${titleIcon}](https://image.tmdb.org/t/p/w500${movie.poster_path})`;
      }
      markdown = `${titleHideLink} *${_.get(movie, 'title')} ${movie._year}*`;
      if (_.get(movie, 'vote_average')) {
        markdown += ` 🔥${movie.vote_average}`;
      }

      markdown += `\n\n`;

      if (_.get(movie, 'genres.length')) {
        const genres = movie.genres.map((e) => _.get(e, 'name')).join(', ');
        markdown += `*Жанр:* ${genres}\n\n`;
      }

      if (_.get(movie, 'overview')) {
        markdown += `*Описание:* ${movie.overview}`;
      }

      return Promise.resolve({
        markdown,
        inline_keyboard: [keyboard],
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getMovieListMsg(type: string, userId: number, params = { page: 1 }) {
    try {
      const currentUser = await this.UserService.get(userId);
      const favoriteMovies = _.get(currentUser, 'favoriteMovies', []);
      const viewedMovies = _.get(currentUser, 'viewedMovies', []);
      let markdown = ``;
      let movies = {
        page: 1,
        total_pages: 1,
        results: [],
      };

      switch (type) {
        case 'popular':
        case 'now_playing':
          movies = await this.getMoviesList(type, params);
          break;

        case '_favorite':
          const size = 10;
          const page = _.get(params, 'page', 1);
          const startPos = (page - 1) * size;
          const endPos = page * size;
          const currentListid = favoriteMovies.slice(startPos, endPos);

          const queries = [];
          _.forEach(currentListid, (id: number) => {
            queries.push(axios.get(`/movie/${id}`));
          });
          const result = await Promise.all(queries);

          movies.results = _.map(result, (response) => _.get(response, 'data'));
          movies.page = page;
          movies.total_pages = _.get(favoriteMovies, 'length')
            ? Math.ceil(favoriteMovies.length / size)
            : 0;
          break;

        default:
          break;
      }

      movies.results.forEach((movie: any) => {
        const isFavorite = favoriteMovies.includes(_.get(movie, 'id'));

        if (_.get(movie, 'release_date')) {
          const date: Date = new Date(movie.release_date);
          movie._year = `(${date.getFullYear()})`;
        }
        const titleSiteLink = `${movie.title} ${movie._year}`;
        if (!viewedMovies.includes(movie.id)) {
          markdown += `🆕 *${titleSiteLink}*`;
          viewedMovies.push(movie.id);
        } else {
          markdown += `${isFavorite ? '⭐ ' : ''}${titleSiteLink}`;
        }

        if (_.get(movie, 'vote_average')) {
          markdown += ` 🔥${movie.vote_average}`;
        }

        markdown += `\nДетали: /movie${movie.id}`;
        if (_.get(movie.videos, 0)) {
          markdown += `\nТрейлер: [просмотр](https://youtu.be/${_.get(
            movie.videos,
            '0.key',
          )})`;
        }

        markdown += '\n\n';
      });
      if (!_.get(movies.results, 'length')) {
        markdown = '🤖 Список пуст';
      }

      const keyboard = [];
      if (movies.page > 1) {
        keyboard.push({
          text: '⬅️',
          callback_data: JSON.stringify({
            t: INLINE_COMMAND_PREVIOS_PAGE,
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
            t: INLINE_COMMAND_NEXT_PAGE,
            p: {
              p: movies.page + 1,
              t: type,
            },
          }),
        });
      }

      await this.UserService.update(
        Object.assign(currentUser, { viewedMovies }),
      );

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
