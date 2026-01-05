import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Ambiente de teste
    environment: 'node',
    
    // Arquivos de teste
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    
    // Timeout para testes de API (podem ser lentos)
    testTimeout: 30000,
    
    // Reporters
    reporters: ['verbose'],
    
    // Globals (describe, it, expect)
    globals: true,
  },
});
