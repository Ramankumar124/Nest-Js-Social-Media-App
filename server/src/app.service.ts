import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    const steering="heere we are testing our application"
    return steering;
  }
}
