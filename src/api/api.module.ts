import { Module } from '@nestjs/common';
import { ApiUserController } from './user/user.controller';
import { ApiUserService } from './user/user.service';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [ApiUserController],
  providers: [ApiUserService],
  imports: [UserModule],
})
export class ApiModule {}
