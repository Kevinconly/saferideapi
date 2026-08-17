import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { DriverRidesController } from './driver-rides.controller';
import { DispatchService } from './dispatch.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DriverRidesController, RidesController],
  providers: [RidesService, DispatchService],
  exports: [RidesService],
})
export class RidesModule {}
