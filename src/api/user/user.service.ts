import { Injectable } from '@nestjs/common';
import { PayloadListDTO, ResponseListDTO } from '../api.interface';
import { UserService } from '../../user/user.service';
import axios from 'axios';

// eslint-disable-next-line
const _ = require('lodash');

@Injectable()
export class ApiUserService {
  public bot: any = null;

  constructor(private readonly UserService: UserService) {
    this.initialize();
  }

  initialize() {
    try {
      axios.defaults.baseURL = process.env.MOVIEDB_ENDPOINT;
      axios.defaults.params = {};
      axios.defaults.params.api_key = process.env.MOVIEDB_TOKEN;
      axios.defaults.params.language = 'ru';
    } catch (e) {
      console.error(e);
    }
  }

  async getUsers(payload: PayloadListDTO): Promise<ResponseListDTO> {
    try {
      const page: number = _.get(payload, 'page') || 0;
      const size = 10;

      const users = await this.UserService.findAll(page * size, size);
      const queriesWrapper = [];

      for (const user of users) {
        const queries = [];

        const resultUser = await axios({
          method: 'POST',
          url: `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChat`,
          data: {
            chat_id: user.id,
          },
        });

        for (const favoriteId of _.get(user, 'favoriteMovies', []).slice(
          0,
          5,
        )) {
          queries.push(
            axios
              .get(`/movie/${favoriteId}`)
              .then((r) => r.data)
              .catch(() => null),
          );
        }

        queriesWrapper.push(
          Promise.all(queries)
            .then((favorites) => ({
              user: _.get(resultUser, 'data.result', null),
              favorites,
            }))
            .catch(() => null),
        );
      }

      const resultMovies = await Promise.all(queriesWrapper);

      const result = {
        page,
        size,
        content: resultMovies.filter((e) => e),
      };
      return Promise.resolve(result);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
