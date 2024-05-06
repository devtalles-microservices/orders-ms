import { Module } from '@nestjs/common';
import { NastModule } from 'src/transports/nast.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [NastModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
