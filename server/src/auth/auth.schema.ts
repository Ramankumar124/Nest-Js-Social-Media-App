import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  refreshToken?: string;
  posts: string[];
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
