import * as SignalR from '@microsoft/signalr';
import { Message } from '../types/chat';

class ChatService {
  private connection: SignalR.HubConnection;

  constructor() {
    this.connection = new SignalR.HubConnectionBuilder()
      .withUrl('http://192.168.218.134:5179/hubs/chat') // replace with your backend
      .withAutomaticReconnect()
      .build();

    this.connection.start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.log('SignalR Error: ', err));
  }

  onReceiveMessage(callback: (msg: Message) => void) {
    this.connection.on('ReceiveMessage', callback);
  }

  offReceiveMessage(callback: (msg: Message) => void) {
    this.connection.off('ReceiveMessage', callback);
  }

  onMessageDelivered(callback: (messageId: string) => void) {
    this.connection.on('MessageDelivered', callback);
  }

  onMessageSeen(callback: (messageId: string) => void) {
    this.connection.on('MessageSeen', callback);
  }

  sendMessage(senderId: string, senderUsername: string, recipientId: string, text: string) {
    return this.connection.invoke('SendMessage', senderId, senderUsername, recipientId, text);
  }

  markAsSeen(messageId: string, originalSenderId: string) {
    return this.connection.invoke('MarkAsSeen', messageId, originalSenderId);
  }
}

export default new ChatService();
