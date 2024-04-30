import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class StatusDto {
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: 'Order status are ',
  })
  status: OrderStatus;
}
