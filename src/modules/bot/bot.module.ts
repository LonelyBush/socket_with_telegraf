import { Module } from '@nestjs/common';

import { BotService } from './bot.service';
import { SocketModule } from '../socket';

@Module({
  imports: [SocketModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
