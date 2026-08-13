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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const admin_service_1 = require("./admin.service");
const admin_dto_1 = require("./dto/admin.dto");
let AdminController = class AdminController {
    admin;
    constructor(admin) {
        this.admin = admin;
    }
    async stats() {
        return this.admin.stats();
    }
    async listUsers(page, pageSize, search) {
        const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
        return this.admin.listUsers(p, ps, search);
    }
    async getUser(id) {
        return this.admin.getUser(id);
    }
    async setUserStatus(user, id, dto) {
        return this.admin.setUserStatus(user.userId, id, dto.status);
    }
    async listDrivers(page, pageSize, search) {
        const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
        return this.admin.listDrivers(p, ps, search);
    }
    async getDriver(id) {
        return this.admin.getDriver(id);
    }
    async approveDriver(user, id) {
        return this.admin.approveDriver(user.userId, id);
    }
    async rejectDriver(user, id, dto) {
        return this.admin.rejectDriver(user.userId, id, dto.reason);
    }
    async listRides(page, pageSize, state, search) {
        const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
        return this.admin.listRides(p, ps, state, search);
    }
    async getRide(id) {
        return this.admin.getRide(id);
    }
    async listPayments(page, pageSize, status) {
        const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
        return this.admin.listPayments(p, ps, status);
    }
    async refundPayment(user, id, dto) {
        return this.admin.refundPayment(user.userId, id, dto.reason);
    }
    async listAuditLogs(page, pageSize, actorId, action) {
        const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
        return this.admin.listAuditLogs(p, ps, actorId, action);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.UpdateUserStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "setUserStatus", null);
__decorate([
    (0, common_1.Get)('drivers'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listDrivers", null);
__decorate([
    (0, common_1.Get)('drivers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDriver", null);
__decorate([
    (0, common_1.Post)('drivers/:id/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveDriver", null);
__decorate([
    (0, common_1.Post)('drivers/:id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.RejectDriverDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectDriver", null);
__decorate([
    (0, common_1.Get)('rides'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listRides", null);
__decorate([
    (0, common_1.Get)('rides/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRide", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Post)('payments/:id/refund'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.AdminRefundDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "refundPayment", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('actorId')),
    __param(3, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAuditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map