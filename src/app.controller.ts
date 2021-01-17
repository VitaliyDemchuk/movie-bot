import { Get, Controller, Res, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getBotDialog(@Res() res) {
    res.status(HttpStatus.OK).send('Bot service started');
  }
}
