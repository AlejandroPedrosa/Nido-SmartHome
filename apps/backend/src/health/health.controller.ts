import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

/**
 * Endpoint de salud para monitoreo y despliegue (EC2, balanceadores, CI).
 * No requiere autenticación ni accede a la base de datos.
 */
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
