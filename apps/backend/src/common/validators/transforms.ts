import { Transform } from 'class-transformer';

/** Recorta espacios de un texto. Otros tipos se dejan intactos para que la validación los rechace. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/** Recorta espacios y convierte el texto vacío en `null` (campo opcional borrable). */
export const TrimToNull = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

/** Convierte 'true' / 'false' del query string a boolean. */
export const ToBoolean = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });
