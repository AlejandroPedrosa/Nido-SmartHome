import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

/**
 * Endpoint de salud para monitoreo y despliegue (EC2, balanceadores, CI).
 * No requiere autenticación ni accede a la base de datos.
 */
@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    };
  }
}
