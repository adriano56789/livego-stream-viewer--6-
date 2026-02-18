"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
// Type guard to check if WebSocket is a CustomWebSocket
function isCustomWebSocket(ws) {
    return 'isAlive' in ws && 'userId' in ws;
}
class WebSocketService {
    constructor(server) {
        this.clients = new Set();
        this.wss = new ws_1.WebSocketServer({ server });
        this.setupWebSocket();
    }
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            const customWs = ws;
            console.log('New client connected');
            this.clients.add(customWs);
            customWs.isAlive = true;
            customWs.on('pong', () => {
                customWs.isAlive = true;
            });
            customWs.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(customWs, data);
                }
                catch (error) {
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
            this.wss.clients.forEach((ws) => {
                if (isCustomWebSocket(ws)) {
                    if (ws.isAlive === false) {
                        return ws.terminate();
                    }
                    ws.isAlive = false;
                    ws.ping(() => { }); // ping with empty callback
                }
            });
        }, 30000);
        this.wss.on('close', () => {
            clearInterval(interval);
        });
    }
    handleMessage(ws, data) {
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
    handleAuth(ws, token) {
        // TODO: Implement JWT verification
        // For now, we'll just store the token
        ws.userId = token; // This should be the user ID from JWT
        console.log(`User ${ws.userId} authenticated`);
    }
    handleJoinStream(ws, streamId) {
        // TODO: Implement stream joining logic
        console.log(`User ${ws.userId} joined stream ${streamId}`);
    }
    handleLeaveStream(ws, streamId) {
        // TODO: Implement stream leaving logic
        console.log(`User ${ws.userId} left stream ${streamId}`);
    }
    broadcastMessage(sender, message) {
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
        this.wss.clients.forEach((client) => {
            if (client !== sender && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(JSON.stringify(messageToSend));
            }
        });
    }
    // Public method to broadcast to specific users or all users
    broadcast(data, filter) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach((client) => {
            if (isCustomWebSocket(client) && client.readyState === ws_1.WebSocket.OPEN) {
                if (!filter || filter(client)) {
                    client.send(message);
                }
            }
        });
    }
    // Method to send message to a specific user
    sendToUser(userId, data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach((client) => {
            if (isCustomWebSocket(client) && client.userId === userId && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
exports.default = WebSocketService;
