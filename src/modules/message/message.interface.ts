export interface Message {
  id: string;
  chatId: string;
  text: string;
  from: 'user' | 'bot';
  username?: string;
  firstName?: string;
  timestamp: number;
}

export interface ChatInfo {
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}
