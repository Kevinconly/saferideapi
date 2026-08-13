"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const config_module_1 = require("./config/config.module");
const config_service_1 = require("./config/config.service");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
const logging_module_1 = require("./logging/logging.module");
const common_module_1 = require("./common/common.module");
const audit_module_1 = require("./modules/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const rides_module_1 = require("./modules/rides/rides.module");
const websocket_module_1 = require("./modules/websocket/websocket.module");
const outbox_module_1 = require("./modules/outbox/outbox.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const payments_module_1 = require("./modules/payments/payments.module");
const admin_module_1 = require("./modules/admin/admin.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                global: true,
                inject: [config_service_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_ACCESS_TOKEN_SECRET'),
                }),
            }),
            logging_module_1.LoggingModule,
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            health_module_1.HealthModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            rides_module_1.RidesModule,
            websocket_module_1.WebsocketModule,
            outbox_module_1.OutboxModule,
            notifications_module_1.NotificationsModule,
            payments_module_1.PaymentsModule,
            admin_module_1.AdminModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map