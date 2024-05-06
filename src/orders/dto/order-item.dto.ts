import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class OrderItemDto {
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  productId: number;

  @IsNumber()
  @Type(() => Number)
  price: number;
}
