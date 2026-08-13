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
exports.RidesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const verified_user_guard_1 = require("../../common/guards/verified-user.guard");
const rides_service_1 = require("./rides.service");
const ride_dto_1 = require("./dto/ride.dto");
let RidesController = class RidesController {
    rides;
    constructor(rides) {
        this.rides = rides;
    }
    async request(user, dto) {
        return this.rides.requestRide(user.userId, dto);
    }
    async listMine(user, page, pageSize) {
        const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const ps = Math.min(50, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
        return this.rides.listMine(user.userId, p, ps);
    }
    async current(user) {
        return this.rides.currentForPassenger(user.userId);
    }
    async fareEstimate(query) {
        return this.rides.fareEstimate({
            lat1: query.pickupLat,
            lng1: query.pickupLng,
            lat2: query.dropoffLat,
            lng2: query.dropoffLng,
        });
    }
    async getOne(user, id) {
        return this.rides.getById(user.userId, id, user.role);
    }
    async cancel(user, id, dto) {
        return this.rides.cancel(user.userId, id, dto.reason);
    }
};
exports.RidesController = RidesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ride_dto_1.CreateRideDto]),
    __metadata("design:returntype", Promise)
], RidesController.prototype, "request", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RidesController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)('current'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RidesController.prototype, "current", null);
__decorate([
    (0, common_1.Get)('fare-estimate'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ride_dto_1.FareEstimateQueryDto]),
    __metadata("design:returntype", Promise)
], RidesController.prototype, "fareEstimate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RidesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ride_dto_1.CancelRideDto]),
    __metadata("design:returntype", Promise)
], RidesController.prototype, "cancel", null);
exports.RidesController = RidesController = __decorate([
    (0, swagger_1.ApiTags)('rides'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('PASSENGER'),
    (0, common_1.UseGuards)(verified_user_guard_1.VerifiedUserGuard),
    (0, common_1.Controller)('rides'),
    __metadata("design:paramtypes", [rides_service_1.RidesService])
], RidesController);
//# sourceMappingURL=rides.controller.js.map