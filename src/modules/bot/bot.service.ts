import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { SocketGateway } from '../socket';
import { SocketService } from '../socket/socket.service';

/**
 * Service that manages the Telegram bot lifecycle and message handling.
 * Initializes the Telegraf bot on module startup, registers command handlers,
 * and bridges communication between Telegram and the WebSocket gateway.
 */
@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly socketService: SocketService,
    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * Initializes the Telegram bot when the module starts.
   * Sets up the bot with the token from environment variables,
   * registers message handlers, and launches the bot.
   * @throws Error if BOT_TOKEN environment variable is not defined
   */
  async onModuleInit(): Promise<void> {
    const token = this.configService.get<string>('BOT_TOKEN');

    if (!token) {
      this.logger.error('BOT_TOKEN is not defined');
      throw new Error('BOT_TOKEN environment variable is required');
    }

    this.bot = new Telegraf(token);
    this.registerHandlers();

    this.socketGateway.setSendMessageHandler((chatId: string, text: string) =>
      this.sendMessage(chatId, text),
    );

    await this.bot.launch();
    this.logger.log('Telegraf bot launched successfully');
  }

  /**
   * Gracefully stops the Telegram bot when the module is destroyed.
   */
  onModuleDestroy(): void {
    if (this.bot) {
      this.bot.stop();
      this.logger.log('Telegraf bot stopped');
    }
  }

  /**
   * Sends a message to a Telegram chat.
   * @param chatId - The Telegram chat ID to send the message to
   * @param text - The message text content
   * @throws Error if the message fails to send
   */
  async sendMessage(chatId: string, text: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, text);
      this.logger.debug('sendMessage', { chatId, textLength: text.length });
    } catch (error: unknown) {
      this.logger.error('Failed to send message', {
        chatId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Registers Telegram bot command and message handlers.
   * Sets up /start command handler and text message listener.
   */
  private registerHandlers(): void {
    this.bot.command('start', async (ctx) => {
      const { chat, from } = ctx.message;

      this.logger.debug('Received /start command', { chatId: chat.id });

      this.socketService.handleBotStartCommand({
        chatId: chat.id.toString(),
        username: from?.username,
        firstName: from?.first_name,
        lastName: from?.last_name,
      });

      await ctx.reply(
        'Привет! Я бот. Напиши мне что-нибудь, и оператор ответит тебе.',
      );
    });

    this.bot.on(message('text'), (ctx) => {
      const { chat, from, text } = ctx.message;

      this.logger.debug('Received text message', { chatId: chat.id, text });

      this.socketService.handleBotMessageReceived({
        chatId: chat.id.toString(),
        text,
        username: from?.username,
        firstName: from?.first_name,
        lastName: from?.last_name,
      });
    });
  }
}
