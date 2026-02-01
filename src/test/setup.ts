import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
vi.stubEnv('ABLY_API_KEY', '');

// Mock Next.js request/response
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextRequest: class MockNextRequest {
      url: string;
      method: string;
      headers: Map<string, string>;
      body: any;

      constructor(url: string, init?: any) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.headers = new Map(Object.entries(init?.headers || {}));
        this.body = init?.body;
      }

      async json() {
        return JSON.parse(this.body);
      }
    },
    NextResponse: {
      json: (data: any, init?: any) => ({
        status: init?.status || 200,
        data,
        json: async () => data,
      }),
    },
  };
});
