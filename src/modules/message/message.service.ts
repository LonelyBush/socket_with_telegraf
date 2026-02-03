import { Injectable, Logger } from '@nestjs/common';
import { ChatInfo, Message } from './message.interface';

/**
 * Service for managing in-memory storage of messages and chat information.
 * Provides CRUD operations for messages and chats used by the WebSocket gateway.
 */
@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  private messages: Message[] = [];
  private chats: Map<string, ChatInfo> = new Map();

  /**
   * Adds a new message to the in-memory storage.
   * @param message - The message object to store
   */
  addMessage(message: Message): void {
    this.messages.push(message);
    this.logger.debug('addMessage', { messagesCount: this.messages.length });
  }

  /**
   * Retrieves messages, optionally filtered by chat ID.
   * @param chatId - Optional chat ID to filter messages
   * @returns Array of messages, filtered by chatId if provided
   */
  getMessages(chatId?: string): Message[] {
    if (chatId) {
      return this.messages.filter((m) => m.chatId === chatId);
    }
    return this.messages;
  }

  /**
   * Retrieves messages newer than a given timestamp.
   * @param timestamp - The timestamp threshold (exclusive)
   * @param chatId - Optional chat ID to filter messages
   * @returns Array of messages with timestamp greater than the provided value
   */
  getMessagesSince(timestamp: number, chatId?: string): Message[] {
    return this.getMessages(chatId).filter((m) => m.timestamp > timestamp);
  }

  /**
   * Adds or updates a chat entry in the storage.
   * Uses chatId as the unique key, so existing chats will be updated.
   * @param chat - The chat information to store
   */
  addChat(chat: ChatInfo): void {
    this.chats.set(chat.chatId, chat);
    this.logger.debug('addChat', { chatsCount: this.chats.size });
  }

  /**
   * Retrieves all stored chats.
   * @returns Array of all chat information objects
   */
  getChats(): ChatInfo[] {
    return Array.from(this.chats.values());
  }

  /**
   * Retrieves a specific chat by its ID.
   * @param chatId - The chat ID to look up
   * @returns The chat information if found, undefined otherwise
   */
  getChat(chatId: string): ChatInfo | undefined {
    return this.chats.get(chatId);
  }
}
