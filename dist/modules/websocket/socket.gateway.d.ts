import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { RealtimeService } from './realtime.service';
import { Server, Socket } from 'socket.io';
export declare class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    private config;
    private realtime;
    private readonly logger;
    server: Server;
    constructor(jwt: JwtService, config: ConfigService, realtime: RealtimeService);
    handleConnection(socket: Socket): void;
    handleDisconnect(socket: Socket): void;
    private authenticate;
}
