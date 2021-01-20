import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

import axios from 'axios';
// eslint-disable-next-line
const _ = require('lodash');

@Injectable()
export class BotService {
  public bot: any = null;

  constructor(private readonly UserService: UserService) {}

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
      const userId = msg.from.id;
      const userMsg = msg.text;
      const commands = [
        { command: 'start', description: 'Активировать сервис бота' },
        { command: 'help', description: 'Показать справку' },
        { command: 'search', description: 'Выполнить поиск среди фильмов' },
        {
          command: 'get_popular_movies',
          description: 'Список популярных фильмов',
        },
        {
          command: 'get_now_playing_movies',
          description: 'Список фильмов которые смотрят сейчас',
        },
      ];

      this.bot.setMyCommands(commands);

      switch (userMsg) {
        case '/start':
          await this.UserService.create({
            id: userId,
            viewedMovies: [],
          });
          this.bot.sendMessage(
            userId,
            `🤖 Здравствуйте. Я создан чтобы вы могли узнать о популярных фильмах. Список моих функций - /help`,
          );
          break;

        case '/help':
          let msg = `🤖 Вот что я умею:\n`;
          commands.forEach((el: any) => {
            msg += `/${el.command} - ${el.description}\n`;
          });
          this.bot.sendMessage(userId, msg);

          break;

        case '/search':
          this.bot.sendMessage(userId, '📝 Введите текст для поиска фильма');
          break;

        case '/get_popular_movies':
        case '/get_now_playing_movies':
          this.bot.sendMessage(
            userId,
            '🔎 Выполняется поиск, пожалуйста, подождите...',
          );
          const urlPart =
            userMsg === '/get_popular_movies'
              ? 'popular'
              : userMsg === '/get_now_playing_movies'
              ? 'now_playing'
              : 'popular';
          const moviesList = await this.getMoviesList(urlPart);

          const currentUser = await this.UserService.get(userId);
          if (currentUser) {
            const viewedMovies = currentUser.viewedMovies || [];
            let emptyResult = true;

            moviesList.forEach((movie: any) => {
              if (!viewedMovies.includes(movie.id)) {
                this.sendPost(userId, movie);
                viewedMovies.push(movie.id);
                emptyResult = false;
              }
            });

            await this.UserService.update({
              id: userId,
              viewedMovies,
            });

            if (emptyResult) {
              this.bot.sendMessage(userId, '🤷‍♂️ Новых фильмов не обнаружено');
            }
          }

          break;

        default:
          this.bot.sendMessage(
            userId,
            '🔎 Выполняется поиск, пожалуйста, подождите...',
          );
          const movies = await this.searchMovies(userMsg);
          if (!_.get(movies, 'length')) {
            this.bot.sendMessage(userId, '😿 Информация о фильме не найдена');
          } else {
            movies.forEach((movie: any) => {
              this.sendPost(userId, movie);
            });
          }
          break;
      }
    });
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
          (el) => el.vote_average >= voteMore,
        ),
      );

      return Promise.resolve(movies);
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
        movie.videos = await this.getMovieVideos(movie.id);
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

    let titleLink = `📺`;
    if (_.get(movie.videos, 0)) {
      titleLink = `[📺](https://youtu.be/${_.get(movie.videos, '0.key')})`;
    } else if (movie.poster_path) {
      titleLink = `[📺](https://image.tmdb.org/t/p/original${movie.poster_path})`;
    }
    markdown = `${titleLink} *${movie.title} ${movie.year}*\n`;

    if (_.get(movie, 'vote_average')) {
      markdown += `⭐ ${movie.vote_average}\n`;
    }

    this.bot.sendMessage(chatId, markdown, {
      parse_mode: 'markdown',
    });
  }
}
