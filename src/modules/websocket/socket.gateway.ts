import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { RealtimeService } from './realtime.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Server, Socket } from 'socket.io';

interface SocketUser {
  userId: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: (origin, cb) => {
      const config = new ConfigService();
      cb(null, config.isOriginAllowed(origin ?? ''));
    },
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('SocketGateway');

  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private realtime: RealtimeService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const user = await this.authenticate(socket);
    if (!user) {
      socket.emit('auth:error', { message: 'Unauthorized' });
      socket.disconnect(true);
      return;
    }

    socket.data.user = user;
    socket.join(`user:${user.userId}`);
    if (user.role === 'DRIVER') {
      socket.join(`drivers`);
    }
    this.realtime.setServer(this.server);
    this.logger.log(`Socket connected: user ${user.userId}`);
  }

  handleDisconnect(socket: Socket): void {
    const user = socket.data?.user as SocketUser | undefined;
    if (user) {
      this.logger.log(`Socket disconnected: user ${user.userId}`);
    }
  }

  private async authenticate(socket: Socket): Promise<SocketUser | null> {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return null;
      const payload = this.jwt.verify<{ sub: string; role: string; tokenVersion?: number }>(token, {
        secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, status: true, tokenVersion: true },
      });
      if (!user || user.status === 'SUSPENDED') return null;
      if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) return null;
      return { userId: user.id, role: user.role };
    } catch {
      return null;
    }
  }
}
