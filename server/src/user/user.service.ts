import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/auth/auth.schema';
import * as argon2 from 'argon2';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}
  async findOne(userId: string) {
    try {
      const user = await this.userModel.findById(userId);

      return user;
    } catch (error) {
        throw error;
    }
  }
  async updateRefreshToken(userId: string, RefreshToken: string) {
    const hashedRefreshToken = await argon2.hash(RefreshToken);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }
}
