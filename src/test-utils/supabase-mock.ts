type QueryResult<T> = { data: T | null; error: null | { message: string; code: string } };

export function createMockSupabase() {
  let _result: any = { data: null, error: null };

  const methods: Record<string, any> = {};
  const chainable = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'ilike', 'order', 'limit', 'range', 'not'];

  for (const m of chainable) {
    methods[m] = vi.fn(() => chain);
  }

  methods.single = vi.fn(() => Promise.resolve(_result));
  methods.maybeSingle = vi.fn(() => Promise.resolve(_result));

  const chain = new Proxy(methods, {
    get(target, prop) {
      if (prop === 'then') {
        const p = Promise.resolve(_result);
        return p.then.bind(p);
      }
      if (prop === 'catch') {
        const p = Promise.resolve(_result);
        return p.catch.bind(p);
      }
      return target[prop as string];
    },
  });

  const mockChannel = {
    on: vi.fn(() => mockChannel),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };

  const defaultFrom = vi.fn(() => chain);
  let currentFrom = defaultFrom;

  return {
    setResult(result: any) { _result = result; },
    reset() {
      _result = { data: null, error: null };
      currentFrom = defaultFrom;
    },
    get from() { return currentFrom; },
    set from(v: any) { currentFrom = v; },
    rpc: vi.fn(() => Promise.resolve(_result)),
    channel: vi.fn(() => mockChannel),
    auth: {
      signUp: vi.fn(() => Promise.resolve(_result)),
      signInWithPassword: vi.fn(() => Promise.resolve(_result)),
      signOut: vi.fn(() => Promise.resolve(_result)),
      getSession: vi.fn(() => Promise.resolve(_result)),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    chain: methods,
    _defaultFromFn: defaultFrom,
  };
}

export type MockSupabase = ReturnType<typeof createMockSupabase>;

export function successResult<T>(data: T): QueryResult<T> {
  return { data, error: null };
}

export function errorResult(message = 'Database error', code = 'PGRST999'): QueryResult<null> {
  return { data: null, error: { message, code } };
}

export function notFoundResult(): QueryResult<null> {
  return { data: null, error: { message: 'Not found', code: 'PGRST116' } };
}
