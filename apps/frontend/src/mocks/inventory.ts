import type { MovementType, ProductUnit } from '@/types';

/** Datos de ejemplo compartidos entre pantallas hasta conectar el backend. */

export interface ProductMock {
    id: string;
    name: string;
    category: string;
    /** Un producto puede estar en varios contenedores (CT-01). */
    containers: string[];
    currentStock: number;
    minStock: number;
    reorderQuantity: number | null;
    unit: ProductUnit;
    /** Forma parte de alguna receta: el borrado responde 409 (RC-06). */
    usedInRecipes: string[];
}

export interface MovementMock {
    id: string;
    productId: string;
    quantity: number;
    type: MovementType;
    reason: string | null;
    createdAt: string;
}

export type StockStatus = 'out' | 'low' | 'ok';

/** Clasificación excluyente de estados de stock (docs/modulos.md, apéndice). */
export const getStockStatus = (current: number, min: number): StockStatus => {
    if (current === 0) return 'out';
    if (current < min) return 'low';
    return 'ok';
};

export const PRODUCT_UNITS: ProductUnit[] = ['unidad', 'g', 'kg', 'ml', 'l', 'paquete', 'botella'];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
    manual: 'Manual',
    recipe_consumption: 'Receta',
    shopping: 'Compra',
};

export const MOCK_CONTAINER_NAMES = ['Alacena', 'Heladera', 'Freezer', 'Cocina', 'Lavadero', 'Baño'];

export const MOCK_PRODUCTS: ProductMock[] = [
    { id: '1', name: 'Leche entera', category: 'Lácteos', containers: ['Heladera'], currentStock: 1, minStock: 3, reorderQuantity: 3, unit: 'l', usedInRecipes: ['Pasta cremosa al limón', 'Tostadas francesas'] },
    { id: '2', name: 'Aceite de oliva', category: 'Despensa', containers: ['Alacena', 'Cocina'], currentStock: 250, minStock: 500, reorderQuantity: 500, unit: 'ml', usedInRecipes: ['Tortilla de patatas', 'Bowl mediterráneo', 'Arroz integral con papas', 'Tacos de pollo especiado'] },
    { id: '3', name: 'Huevos de campo', category: 'Frescos', containers: ['Heladera'], currentStock: 4, minStock: 12, reorderQuantity: null, unit: 'unidad', usedInRecipes: ['Tortilla de patatas', 'Tostadas francesas'] },
    { id: '4', name: 'Arroz integral', category: 'Granos', containers: ['Alacena'], currentStock: 300, minStock: 1000, reorderQuantity: 1000, unit: 'g', usedInRecipes: ['Bowl mediterráneo', 'Arroz integral con papas'] },
    { id: '5', name: 'Papas blancas', category: 'Verduras', containers: ['Alacena'], currentStock: 2, minStock: 1, reorderQuantity: null, unit: 'kg', usedInRecipes: ['Tortilla de patatas', 'Bowl mediterráneo', 'Arroz integral con papas'] },
    { id: '6', name: 'Pechuga de pollo', category: 'Carnes', containers: ['Freezer'], currentStock: 1500, minStock: 800, reorderQuantity: null, unit: 'g', usedInRecipes: ['Bowl mediterráneo', 'Tacos de pollo especiado'] },
    { id: '7', name: 'Pasta penne', category: 'Pastas', containers: ['Alacena'], currentStock: 2, minStock: 1, reorderQuantity: null, unit: 'paquete', usedInRecipes: ['Pasta cremosa al limón'] },
    { id: '8', name: 'Detergente líquido', category: 'Limpieza', containers: ['Lavadero'], currentStock: 1, minStock: 1, reorderQuantity: null, unit: 'botella', usedInRecipes: [] },
    { id: '9', name: 'Azúcar', category: 'Despensa', containers: ['Alacena'], currentStock: 0, minStock: 500, reorderQuantity: 1000, unit: 'g', usedInRecipes: ['Tacos de pollo especiado'] },
];

export const MOCK_MOVEMENTS: MovementMock[] = [
    { id: 'm1', productId: '1', quantity: -2, type: 'recipe_consumption', reason: 'Receta: Tostadas francesas', createdAt: '2026-11-11T13:15:00Z' },
    { id: 'm2', productId: '1', quantity: 2, type: 'shopping', reason: 'Compra semanal', createdAt: '2026-11-09T19:40:00Z' },
    { id: 'm3', productId: '1', quantity: 3, type: 'manual', reason: 'Stock inicial', createdAt: '2026-11-02T10:00:00Z' },
    { id: 'm4', productId: '3', quantity: -4, type: 'recipe_consumption', reason: 'Receta: Tortilla de patatas', createdAt: '2026-11-10T21:05:00Z' },
    { id: 'm5', productId: '3', quantity: 8, type: 'shopping', reason: null, createdAt: '2026-11-05T18:20:00Z' },
    { id: 'm6', productId: '6', quantity: -500, type: 'manual', reason: 'Se descongeló y se cocinó', createdAt: '2026-11-10T12:10:00Z' },
    { id: 'm7', productId: '9', quantity: -250, type: 'manual', reason: 'Derrame', createdAt: '2026-11-08T09:30:00Z' },
];

export const formatMovementDate = (iso: string): string =>
    new Date(iso).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
    }) + ' UTC';
