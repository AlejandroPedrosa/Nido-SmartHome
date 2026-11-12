import type { ProductMock } from '@/mocks/inventory';

export interface RecipeIngredientMock {
    productId: string;
    /** Cantidad que consume la receta, en la unidad del producto (UN-02). */
    quantity: number;
}

export interface RecipeMock {
    id: string;
    name: string;
    servings: number;
    /** Un paso por línea. */
    instructions: string;
    ingredients: RecipeIngredientMock[];
    // Decoración de las maquetas: el backend todavía no guarda estos campos.
    category?: string;
    prepTime?: number;
    image?: string;
}

export interface IngredientStatus {
    product: ProductMock;
    required: number;
    /** RC-04: el stock actual cubre la cantidad requerida. */
    available: boolean;
}

export const getIngredientStatuses = (recipe: RecipeMock, products: ProductMock[]): IngredientStatus[] =>
    recipe.ingredients.flatMap((ingredient) => {
        const product = products.find((p) => p.id === ingredient.productId);
        if (!product) return [];
        return [
            {
                product,
                required: ingredient.quantity,
                available: product.currentStock >= ingredient.quantity,
            },
        ];
    });

export const MOCK_RECIPES: RecipeMock[] = [
    {
        id: '1',
        name: 'Tortilla de patatas',
        category: 'Clásicos',
        prepTime: 35,
        servings: 4,
        image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80',
        instructions:
            'Pelá y cortá las papas en rodajas finas.\nFreílas en aceite a fuego medio hasta que estén tiernas.\nBatí los huevos con una pizca de sal y mezclalos con las papas escurridas.\nCuajá la mezcla en la sartén, dala vuelta y cocinala 3 minutos más.',
        ingredients: [
            { productId: '5', quantity: 1 },
            { productId: '3', quantity: 4 },
            { productId: '2', quantity: 100 },
        ],
    },
    {
        id: '2',
        name: 'Pasta cremosa al limón',
        category: 'Pasta',
        prepTime: 25,
        servings: 2,
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
        instructions:
            'Herví la pasta en agua con sal hasta que esté al dente.\nCalentá la leche con ralladura de limón sin que llegue a hervir.\nMezclá la pasta con la salsa y servila enseguida.',
        ingredients: [
            { productId: '7', quantity: 1 },
            { productId: '1', quantity: 0.5 },
        ],
    },
    {
        id: '3',
        name: 'Bowl mediterráneo',
        category: 'Vegetariana',
        prepTime: 20,
        servings: 2,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        instructions:
            'Cociná el arroz integral y dejalo enfriar.\nSaltá el pollo en cubos con un poco de aceite.\nArmá el bowl con arroz, pollo y papas hervidas, y condimentá con aceite.',
        ingredients: [
            { productId: '2', quantity: 30 },
            { productId: '4', quantity: 500 },
            { productId: '6', quantity: 300 },
            { productId: '5', quantity: 0.5 },
        ],
    },
    {
        id: '4',
        name: 'Arroz integral con papas',
        category: 'De cuchara',
        prepTime: 45,
        servings: 4,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        instructions:
            'Sofreí las papas en cubos con aceite.\nAgregá el arroz integral y cubrilo con agua.\nCociná tapado a fuego bajo unos 35 minutos.',
        ingredients: [
            { productId: '4', quantity: 200 },
            { productId: '5', quantity: 0.5 },
            { productId: '2', quantity: 30 },
        ],
    },
    {
        id: '5',
        name: 'Tacos de pollo especiado',
        category: 'Rápidas',
        prepTime: 30,
        servings: 4,
        image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
        instructions:
            'Cortá el pollo en tiras y marinalo con especias y una pizca de azúcar.\nSaltalo en una sartén caliente con aceite.\nServí en tortillas con los toppings que prefieras.',
        ingredients: [
            { productId: '6', quantity: 400 },
            { productId: '2', quantity: 20 },
            { productId: '9', quantity: 10 },
        ],
    },
    {
        id: '6',
        name: 'Tostadas francesas',
        category: 'Desayuno',
        prepTime: 15,
        servings: 2,
        image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80',
        instructions:
            'Batí los huevos con la leche.\nEmbebé las rebanadas de pan en la mezcla.\nDoralas en una sartén por ambos lados.',
        ingredients: [
            { productId: '3', quantity: 2 },
            { productId: '1', quantity: 0.25 },
        ],
    },
];
