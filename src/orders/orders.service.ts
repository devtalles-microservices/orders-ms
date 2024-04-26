import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Order database connected`);
  }

  create(createOrderDto: CreateOrderDto) {
    return createOrderDto;
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }
}
