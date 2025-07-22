import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { CatsService } from './cat.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {

    this.catsService.create(createCatDto);
  }
  @Get()
  async findAll(): Promise<Cat[]> {
    try {
        await this.catsService.findAll();
    } catch (error) {
        
        throw new  HttpException({
            status:HttpStatus.FORBIDDEN,

        },
        HttpStatus.FORBIDDEN, {
            cause:error
        }
    )
    }
    return this.catsService.findAll();
  }
}
