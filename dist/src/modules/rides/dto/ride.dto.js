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
exports.FareEstimateQueryDto = exports.RejectRideDto = exports.UpdateRideStatusDto = exports.AcceptRideDto = exports.CancelRideDto = exports.CreateRideDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateRideDto {
    pickupLat;
    pickupLng;
    pickupLabel;
    dropoffLat;
    dropoffLng;
    dropoffLabel;
}
exports.CreateRideDto = CreateRideDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: -1.9501 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "pickupLat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30.0619 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "pickupLng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateRideDto.prototype, "pickupLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -1.9441 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "dropoffLat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30.0922 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRideDto.prototype, "dropoffLng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateRideDto.prototype, "dropoffLabel", void 0);
class CancelRideDto {
    reason;
}
exports.CancelRideDto = CancelRideDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CancelRideDto.prototype, "reason", void 0);
class AcceptRideDto {
    offerId;
    idempotencyKey;
}
exports.AcceptRideDto = AcceptRideDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AcceptRideDto.prototype, "offerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptRideDto.prototype, "idempotencyKey", void 0);
class UpdateRideStatusDto {
    newState;
}
exports.UpdateRideStatusDto = UpdateRideStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PICKED_UP' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], UpdateRideStatusDto.prototype, "newState", void 0);
class RejectRideDto {
    offerId;
}
exports.RejectRideDto = RejectRideDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RejectRideDto.prototype, "offerId", void 0);
class FareEstimateQueryDto {
    pickupLat;
    pickupLng;
    dropoffLat;
    dropoffLng;
}
exports.FareEstimateQueryDto = FareEstimateQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: -1.9501 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], FareEstimateQueryDto.prototype, "pickupLat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30.0619 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], FareEstimateQueryDto.prototype, "pickupLng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -1.9441 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], FareEstimateQueryDto.prototype, "dropoffLat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30.0922 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], FareEstimateQueryDto.prototype, "dropoffLng", void 0);
//# sourceMappingURL=ride.dto.js.map