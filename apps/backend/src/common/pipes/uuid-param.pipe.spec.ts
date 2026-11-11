import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { uuidParam } from './uuid-param.pipe';

describe('uuidParam', () => {
  const metadata: ArgumentMetadata = { type: 'param', data: 'id' };
  const pipe = uuidParam('id');

  it('acepta un UUID v4', async () => {
    const id = '3f1c2b9e-8d4a-4f6b-9c2e-1a2b3c4d5e6f';
    await expect(pipe.transform(id, metadata)).resolves.toBe(id);
  });

  it.each(['abc', '123', '3f1c2b9e-8d4a-1f6b-9c2e-1a2b3c4d5e6f'])(
    'rechaza %p con mensaje en español',
    async (value) => {
      await expect(pipe.transform(value, metadata)).rejects.toThrow(
        new BadRequestException('id debe ser un UUID válido'),
      );
    },
  );
});
