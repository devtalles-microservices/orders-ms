import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { OrderPaginationDto } from './dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { StatusDto } from './dto/status.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(NATS_SERVICE)
    private readonly productClient: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Order database connected`);
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const { items } = createOrderDto;
      const productsId = items.map((i) => i.productId);

      const products: any[] = await firstValueFrom(
        this.productClient.send({ cmd: 'validate_products' }, productsId),
      );

      const totalAmount = items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;

        return acc + price * orderItem.quantity;
      }, 0);

      const totalItems = items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          orderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                productId: orderItem.productId,
                quantity: orderItem.quantity,
                price: products.find((p) => p.id === orderItem.productId).price,
              })),
            },
          },
        },
        include: {
          orderItem: {
            select: {
              price: true,
              productId: true,
              quantity: true,
            },
          },
        },
      });

      return {
        ...order,
        orderItem: order.orderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((p) => p.id === orderItem.productId).name,
        })),
      };
    } catch (err) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs',
      });
    }
  }

  async findAll(paginationDto: OrderPaginationDto) {
    const totalPages = await this.order.count({
      where: {
        status: paginationDto.status,
      },
    });

    const currentPage = paginationDto.page;
    const perPage = paginationDto.limit;

    return {
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: paginationDto.status,
        },
      }),
      metadata: {
        total: totalPages,
        page: currentPage,
        lasPage: Math.ceil(totalPages / perPage),
      },
    };
  }

  async findOne(id: string) {
    try {
      const order = await this.order.findFirst({
        where: { id },
        include: {
          orderItem: {
            select: {
              price: true,
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (!order)
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Order with id not foubd',
        });

      const productsId = order.orderItem.map((i) => i.productId);

      const products: any[] = await firstValueFrom(
        this.productClient.send({ cmd: 'validate_products' }, productsId),
      );

      return {
        ...order,
        orderItem: order.orderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((p) => p.id === orderItem.productId).name,
        })),
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async changeStatus(statusDto: StatusDto) {
    const { id, status } = statusDto;

    const order = await this.findOne(id);

    if (order.status === status) return order;

    return this.order.update({
      where: { id },
      data: {
        status,
      },
    });
  }
}
