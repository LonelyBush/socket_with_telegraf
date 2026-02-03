import { Module } from '@nestjs/common';

import { SocketGateway } from './socket.gateway';
import { MessageModule } from '../message/message.module';
import { SocketService } from './socket.service';

@Module({
  imports: [MessageModule],
  providers: [SocketGateway, SocketService],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
