import { resolveFrontendUrl } from './frontend-url';

describe('resolveFrontendUrl', () => {
  it('usa FRONTEND_URL sin barra final si está definida', () => {
    expect(
      resolveFrontendUrl('https://nido.vercel.app/', 'http://localhost:5173'),
    ).toBe('https://nido.vercel.app');
  });

  it('sin FRONTEND_URL usa el primer origen de CORS_ORIGIN', () => {
    expect(
      resolveFrontendUrl(
        undefined,
        ' http://localhost:5173/ , https://nido.vercel.app',
      ),
    ).toBe('http://localhost:5173');
  });

  it('ignora un FRONTEND_URL vacío', () => {
    expect(resolveFrontendUrl('  ', 'https://nido.vercel.app')).toBe(
      'https://nido.vercel.app',
    );
  });

  it('falla si no hay ninguna URL disponible', () => {
    expect(() => resolveFrontendUrl(undefined, ' , ')).toThrow(
      'No se pudo determinar la URL del frontend',
    );
  });
});
