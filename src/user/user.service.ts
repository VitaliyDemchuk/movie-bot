import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async delete(id: number): Promise<User[]> {
    return this.userModel.deleteOne({ id });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOneOrCreate(input: CreateUserDto): Promise<User> {
    const { id } = input;
    const user = await this.userModel.findOne({ id }).exec();

    if (Boolean(user)) {
      return user;
    } else {
      return this.create(input);
    }
  }
}
