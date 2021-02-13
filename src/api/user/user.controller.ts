import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiUserService } from './user.service';
import { PayloadListDTO, ResponseListDTO } from '../api.interface';

@Controller('api')
export class ApiUserController {
  constructor(private readonly ApiUserService: ApiUserService) {}

  @HttpCode(200)
  @Post('user/list')
  async getUsers(@Body() payload: PayloadListDTO): Promise<ResponseListDTO> {
    return await this.ApiUserService.getUsers(payload);
  }
}
