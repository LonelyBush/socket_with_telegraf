import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SendMessageDto } from './dto';
import { MessageService } from '../message/message.service';
import { SendMessageHandler } from './socket.interfact';

/**
 * WebSocket gateway for real-time communication between the web client and server.
 * Handles client connections, message routing, and broadcasts updates to connected clients.
 */
@WebSocketGateway(8081, {
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SocketGateway.name);
  private sendMessageHandler: SendMessageHandler | null = null;

  @WebSocketServer()
  server: Server;

  constructor(private readonly messageService: MessageService) {}

  /**
   * Registers the handler function for sending messages to Telegram.
   * Called by BotService during initialization to enable message forwarding.
   * @param handler - The function to call when sending messages to Telegram
   */
  setSendMessageHandler(handler: SendMessageHandler): void {
    this.sendMessageHandler = handler;
  }

  /**
   * Handles new WebSocket client connections.
   * Sends the current list of chats to the newly connected client.
   * @param client - The connected Socket.io client
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('get_chats', this.messageService.getChats());
  }

  /**
   * Handles WebSocket client disconnections.
   * @param client - The disconnected Socket.io client
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcasts an event with data to all connected clients.
   * @param event - The event name to emit
   * @param data - The data payload to send
   */
  broadcast(event: string, data: unknown): void {
    this.server.emit(event, data);
  }

  /**
   * Handles 'get_chat_messages' event from clients.
   * Retrieves and sends all messages for a specific chat to the requesting client.
   * @param data - Object containing the chatId to fetch messages for
   * @param client - The requesting Socket.io client
   */
  @SubscribeMessage('get_chat_messages')
  getChatsMessage(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { chatId } = data;

    this.logger.debug('getChatsMessages', { clientId: client.id, chatId });
    const messages = this.messageService.getMessages(chatId);

    client.emit('get_chat_messages', messages);
  }

  /**
   * Handles 'send_message' event from clients.
   * Forwards the message to Telegram via the registered handler, stores it,
   * and broadcasts the updated message list to all connected clients.
   * @param data - The message data containing chatId and text
   * @param client - The sending Socket.io client
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { chatId, text } = data;

    this.logger.debug('handleSendMessage', { clientId: client.id, chatId });

    if (!this.sendMessageHandler) {
      this.logger.error('sendMessageHandler not set');
      client.emit('error', { message: 'Bot not initialized' });
      return;
    }

    try {
      await this.sendMessageHandler(chatId, text);

      this.messageService.addMessage({
        id: `${chatId}-${Date.now()}`,
        chatId,
        text,
        from: 'bot',
        timestamp: Date.now(),
      });

      this.server.emit(
        'message_from_bot',
        this.messageService.getMessages(chatId),
      );
    } catch (error: unknown) {
      this.logger.error('Failed to send message to Telegram', {
        chatId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      client.emit('error', { message: 'Failed to send message to Telegram' });
    }
  }
}
