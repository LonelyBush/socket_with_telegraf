import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { SocketGateway } from './socket.gateway';
import {
  BotMessageReceivedParams,
  BotStartCommandParams,
} from './socket.interfact';
import { MessageService } from '../message/message.service';
import { ChatInfo, Message } from '../message/message.interface';

/**
 * Service that bridges the Telegram bot events with WebSocket clients.
 * Handles incoming bot events and broadcasts updates to connected web clients.
 */
@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * Handles the /start command from Telegram bot.
   * Creates a new chat entry and broadcasts the updated chat list to all connected clients.
   * @param params - The parameters containing chat and user information
   */
  handleBotStartCommand(params: BotStartCommandParams): void {
    this.logger.log('handleBotStartCommand', { chatId: params.chatId });

    const newChat: ChatInfo = {
      chatId: params.chatId,
      username: params.username,
      firstName: params.firstName,
      lastName: params.lastName,
    };

    this.messageService.addChat(newChat);
    this.socketGateway.broadcast('new_chat', this.messageService.getChats());
  }

  /**
   * Handles incoming messages from Telegram users.
   * Stores the message, updates the chat entry, and broadcasts to all connected clients.
   * @param params - The parameters containing message and user information
   */
  handleBotMessageReceived(params: BotMessageReceivedParams): void {
    const { chatId, text, username, firstName, lastName } = params;

    this.logger.log(`[Bot] Message from ${username || firstName}: ${text}`);

    const newMessage: Message = {
      id: uuidv4(),
      chatId,
      text,
      from: 'user',
      username,
      firstName,
      timestamp: Date.now(),
    };

    this.messageService.addChat({
      chatId,
      username,
      firstName,
      lastName,
    });

    this.messageService.addMessage(newMessage);
    this.socketGateway.broadcast(
      'message_from_user',
      this.messageService.getMessages(chatId),
    );
  }
}
