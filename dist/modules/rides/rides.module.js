"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidesModule = void 0;
const common_1 = require("@nestjs/common");
const rides_service_1 = require("./rides.service");
const rides_controller_1 = require("./rides.controller");
const driver_rides_controller_1 = require("./driver-rides.controller");
const dispatch_service_1 = require("./dispatch.service");
const outbox_module_1 = require("../outbox/outbox.module");
const notifications_module_1 = require("../notifications/notifications.module");
const audit_module_1 = require("../audit/audit.module");
let RidesModule = class RidesModule {
};
exports.RidesModule = RidesModule;
exports.RidesModule = RidesModule = __decorate([
    (0, common_1.Module)({
        imports: [outbox_module_1.OutboxModule, notifications_module_1.NotificationsModule, audit_module_1.AuditModule],
        controllers: [driver_rides_controller_1.DriverRidesController, rides_controller_1.RidesController],
        providers: [rides_service_1.RidesService, dispatch_service_1.DispatchService],
        exports: [rides_service_1.RidesService],
    })
], RidesModule);
//# sourceMappingURL=rides.module.js.map