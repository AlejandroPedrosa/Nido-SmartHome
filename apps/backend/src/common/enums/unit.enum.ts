/**
 * Unidades de medida permitidas (regla UN-01). Coinciden con el CHECK
 * `products_unit_check` de la base. No hay conversiones entre unidades
 * (UN-02): stock, mínimos, reposición e ingredientes usan la del producto.
 */
export enum Unit {
  Gram = 'g',
  Kilogram = 'kg',
  Milliliter = 'ml',
  Liter = 'l',
  Unit = 'unidad',
  Package = 'paquete',
  Bottle = 'botella',
}

/** Unidad por defecto al crear un producto sin especificarla (UN-03). */
export const DEFAULT_UNIT = Unit.Unit;
