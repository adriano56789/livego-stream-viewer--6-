import { WebSocketServer, WebSocket as WS } from 'ws';
import { Server } from 'http';
import { IUser } from '../models/User';

// Extend WebSocket type with our custom properties
interface CustomWebSocket extends WS {
  isAlive: boolean;
  userId?: string;
  user?: IUser;
}

// Type guard to check if WebSocket is a CustomWebSocket
function isCustomWebSocket(ws: WS): ws is CustomWebSocket {
  return 'isAlive' in ws && 'userId' in ws;
}

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<CustomWebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WS) => {
      const customWs = ws as CustomWebSocket;
      console.log('New client connected');
      this.clients.add(customWs);
      customWs.isAlive = true;

      customWs.on('pong', () => {
        customWs.isAlive = true;
      });

      customWs.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(customWs, data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      customWs.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(customWs);
      });

      // Send a welcome message
      customWs.send(JSON.stringify({ type: 'connection', status: 'connected' }));
    });

    // Ping clients every 30 seconds to check connection
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WS) => {
        if (isCustomWebSocket(ws)) {
          if (ws.isAlive === false) {
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping(() => {}); // ping with empty callback
        }
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  private handleMessage(ws: CustomWebSocket, data: any) {
    switch (data.type) {
      case 'AUTH':
        this.handleAuth(ws, data.token);
        break;
      case 'CHAT_MESSAGE':
        this.broadcastMessage(ws, data);
        break;
      case 'JOIN_STREAM':
        this.handleJoinStream(ws, data.streamId);
        break;
      case 'LEAVE_STREAM':
        this.handleLeaveStream(ws, data.streamId);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private handleAuth(ws: CustomWebSocket, token: string) {
    // TODO: Implement JWT verification
    // For now, we'll just store the token
    ws.userId = token; // This should be the user ID from JWT
    console.log(`User ${ws.userId} authenticated`);
  }

  private handleJoinStream(ws: CustomWebSocket, streamId: string) {
    // TODO: Implement stream joining logic
    console.log(`User ${ws.userId} joined stream ${streamId}`);
  }

  private handleLeaveStream(ws: CustomWebSocket, streamId: string) {
    // TODO: Implement stream leaving logic
    console.log(`User ${ws.userId} left stream ${streamId}`);
  }

  private broadcastMessage(sender: CustomWebSocket, message: any) {
    // Don't broadcast if the message is from an unauthenticated user
    if (!sender.userId) {
      console.log('Unauthenticated user tried to send a message');
      return;
    }

    // Add sender info to the message
    const messageToSend = {
      ...message,
      senderId: sender.userId,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all connected clients
    this.wss.clients.forEach((client: WS) => {
      if (client !== sender && client.readyState === WS.OPEN) {
        client.send(JSON.stringify(messageToSend));
      }
    });
  }

  // Public method to broadcast to specific users or all users
  public broadcast(data: any, filter?: (client: CustomWebSocket) => boolean) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client: WS) => {
      if (isCustomWebSocket(client) && client.readyState === WS.OPEN) {
        if (!filter || filter(client)) {
          client.send(message);
        }
      }
    });
  }

  // Method to send message to a specific user
  public sendToUser(userId: string, data: any) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client: WS) => {
      if (isCustomWebSocket(client) && client.userId === userId && client.readyState === WS.OPEN) {
        client.send(message);
      }
    });
  }
}

export default WebSocketService;
