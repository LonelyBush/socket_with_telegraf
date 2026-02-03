/**
 * Parameters for handling the /start command from Telegram bot
 */
export interface BotStartCommandParams {
  /** The Telegram chat ID */
  chatId: string;
  /** The Telegram username (optional) */
  username?: string;
  /** The user's first name (optional) */
  firstName?: string;
  /** The user's last name (optional) */
  lastName?: string;
}

/**
 * Parameters for handling incoming messages from Telegram bot
 */
export interface BotMessageReceivedParams {
  /** The Telegram chat ID */
  chatId: string;
  /** The message text content */
  text: string;
  /** The Telegram username (optional) */
  username?: string;
  /** The user's first name (optional) */
  firstName?: string;
  /** The user's last name (optional) */
  lastName?: string;
}

/**
 * Handler function type for sending messages to Telegram
 * @param chatId - The Telegram chat ID
 * @param text - The message text to send
 */
export interface SendMessageHandler {
  (chatId: string, text: string): Promise<void>;
}
