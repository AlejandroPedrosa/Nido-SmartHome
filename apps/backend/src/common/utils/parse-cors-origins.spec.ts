import { parseCorsOrigins } from './parse-cors-origins';

describe('parseCorsOrigins', () => {
  it('devuelve un único origen', () => {
    expect(parseCorsOrigins('http://localhost:5173')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('separa múltiples orígenes por coma y recorta espacios', () => {
    expect(
      parseCorsOrigins('http://localhost:5173 ,  https://nido.vercel.app'),
    ).toEqual(['http://localhost:5173', 'https://nido.vercel.app']);
  });

  it('quita la barra final de cada origen', () => {
    expect(parseCorsOrigins('https://nido.vercel.app/')).toEqual([
      'https://nido.vercel.app',
    ]);
  });

  it('ignora entradas vacías', () => {
    expect(parseCorsOrigins('http://localhost:5173,,  ,')).toEqual([
      'http://localhost:5173',
    ]);
  });
});
