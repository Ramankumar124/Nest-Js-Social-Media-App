import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  refreshToken?: string;
  posts: string[];
  comparePassword(password: string): Promise<boolean>;
  createAccessToken(): string;
  createRefreshToken(): string;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ type: [{ type: 'ObjectId', ref: 'Post' }] })
  posts: string[];
}

export const userSchema = SchemaFactory.createForClass(User);

userSchema.pre('save', async function (this: IUser & Document, next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.createAccessToken = function () {
  //@ts-ignore

  return jwt.sign(
    { id: this._id, name: this.name, email: this.email },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY! },
  );
};

userSchema.methods.createRefreshToken = function () {
  //@ts-ignore

  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY! || '10d' } as {
      expiresIn: string | number;
    },
  );
};
