export interface Message {
    Id?: string;
    SenderId: string;
    SenderUsername: string;
    RecipientId: string;
    Text: string;
    Timestamp?: string;
    Status?: 'sent' | 'seen' | 'delivered';
  }
  
  export interface User {
    Id: string;
    Username: string;
    Email?: string;
  }
  