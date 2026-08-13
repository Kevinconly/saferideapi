"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const config_service_1 = require("../../config/config.service");
const realtime_service_1 = require("./realtime.service");
const socket_io_1 = require("socket.io");
let SocketGateway = class SocketGateway {
    jwt;
    config;
    realtime;
    logger = new common_1.Logger('SocketGateway');
    server;
    constructor(jwt, config, realtime) {
        this.jwt = jwt;
        this.config = config;
        this.realtime = realtime;
    }
    handleConnection(socket) {
        const user = this.authenticate(socket);
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
    handleDisconnect(socket) {
        const user = socket.data?.user;
        if (user) {
            this.logger.log(`Socket disconnected: user ${user.userId}`);
        }
    }
    authenticate(socket) {
        try {
            const token = socket.handshake.auth?.token ??
                socket.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token)
                return null;
            const payload = this.jwt.verify(token, {
                secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
            });
            return { userId: payload.sub, role: payload.role };
        }
        catch {
            return null;
        }
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*', credentials: true } }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_service_1.ConfigService,
        realtime_service_1.RealtimeService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map