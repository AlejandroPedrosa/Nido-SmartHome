import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase-client.factory';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: {} })),
}));

describe('createSupabaseClient', () => {
  it('crea el cliente con la URL y la Publishable key', () => {
    createSupabaseClient({
      url: 'https://ref.supabase.co',
      publishableKey: 'sb_publishable_test',
    });

    expect(createClient).toHaveBeenCalledWith(
      'https://ref.supabase.co',
      'sb_publishable_test',
      expect.any(Object),
    );
  });

  it('no persiste ni renueva sesiones (cliente compartido en el servidor)', () => {
    createSupabaseClient({
      url: 'https://ref.supabase.co',
      publishableKey: 'sb_publishable_test',
    });

    expect(createClient).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(String),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  });
});
