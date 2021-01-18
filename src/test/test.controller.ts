import { Controller, Get, Header } from '@nestjs/common';

@Controller('wakemydyno.txt')
export class TestController {
  @Get()
  @Header('Content-Type', 'text/plain')
  findAll(): string {
    return 'wakemydyno.txt';
  }
}
