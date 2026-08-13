import { Server } from 'socket.io';
export declare class RealtimeService {
    private server;
    setServer(server: Server): void;
    emitToUser(userId: string, event: string, data: unknown): void;
    emitToRoom(room: string, event: string, data: unknown): void;
    emitBroadcast(event: string, data: unknown): void;
}
