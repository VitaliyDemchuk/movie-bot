import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(user: CreateUserDto): Promise<User> {
    const { id } = user;
    const existUser = await this.userModel.findOne({ id }).exec();

    if (Boolean(existUser)) {
      return existUser;
    } else {
      return this.userModel.create(user);
    }
  }

  async update(user: CreateUserDto): Promise<User> {
    const { id } = user;
    return this.userModel.updateOne({ id }, user);
  }

  async delete(id: number): Promise<User> {
    return this.userModel.deleteOne({ id });
  }

  async get(id: number): Promise<User> {
    return this.userModel.findOne({ id }).exec();
  }

  async findAll(skip = 0, limit = 0): Promise<User[]> {
    return this.userModel.find().skip(skip).limit(limit).exec();
  }

  async count(): Promise<number> {
    return this.userModel.count().exec();
  }
}
