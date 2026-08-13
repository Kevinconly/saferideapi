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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverRidesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const rides_service_1 = require("./rides.service");
const ride_dto_1 = require("./dto/ride.dto");
let DriverRidesController = class DriverRidesController {
    rides;
    constructor(rides) {
        this.rides = rides;
    }
    async current(user) {
        const driverId = await this.requireDriverId(user.userId);
        return this.rides.currentForDriver(driverId);
    }
    async history(user, page, pageSize) {
        const driverId = await this.requireDriverId(user.userId);
        const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const ps = Math.min(50, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
        return this.rides.listForDriver(driverId, p, ps);
    }
    async accept(user, id, dto) {
        const driverId = await this.requireDriverId(user.userId);
        return this.rides.acceptRide(driverId, id, dto.offerId);
    }
    async reject(user, id, dto) {
        const driverId = await this.requireDriverId(user.userId);
        return this.rides.rejectRide(driverId, id, dto.offerId);
    }
    async updateStatus(user, id, dto) {
        const driverId = await this.requireDriverId(user.userId);
        return this.rides.updateState(driverId, id, dto.newState);
    }
    async getOne(user, id) {
        return this.rides.getById(user.userId, id, user.role);
    }
    async requireDriverId(userId) {
        const driver = await this.rides.findDriverByUserId(userId);
        if (!driver)
            throw new common_1.NotFoundException('Driver profile not found');
        return driver.id;
    }
};
exports.DriverRidesController = DriverRidesController;
__decorate([
    (0, common_1.Get)('current'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverRidesController.prototype, "current", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DriverRidesController.prototype, "history", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ride_dto_1.AcceptRideDto]),
    __metadata("design:returntype", Promise)
], DriverRidesController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ride_dto_1.RejectRideDto]),
    __metadata("design:returntype", Promise)
], DriverRidesController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ride_dto_1.UpdateRideStatusDto]),
    __metadata("design:returntype", Promise)
], DriverRidesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DriverRidesController.prototype, "getOne", null);
exports.DriverRidesController = DriverRidesController = __decorate([
    (0, swagger_1.ApiTags)('rides'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('DRIVER'),
    (0, common_1.Controller)('rides/driver'),
    __metadata("design:paramtypes", [rides_service_1.RidesService])
], DriverRidesController);
//# sourceMappingURL=driver-rides.controller.js.map