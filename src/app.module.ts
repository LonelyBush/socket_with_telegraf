import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './modules/bot/bot.module';
import { SocketModule } from './modules/socket';
import { MessageModule } from './modules/message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MessageModule,
    SocketModule,
    BotModule,
  ],
})
export class AppModule {}
