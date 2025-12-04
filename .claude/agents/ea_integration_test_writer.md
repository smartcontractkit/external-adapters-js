### External Adapter Framework–only runbook for integration tests

### 1. Test file layout (EAF)

- **Directory**: `packages/sources/<adapter>/test/integration/`
- **Files**
  - **Core HTTP**: `adapter.test.ts`
  - **Per-endpoint** (optional when complex): e.g. `totalBalance.test.ts`, `wallet.test.ts`, `nav.test.ts`
  - **Websocket / streaming**: `adapter-ws.test.ts`, `<endpoint>.test.ts`
  - **Fixtures**: `fixtures.ts` (and `fixtures-*.ts` for larger suites)
  - **Utils** (optional): `utils/fixtures.ts`, `utils/testConfig.ts`, `utils/utilFunctions.ts`

---

### 2. Standard EAF integration test skeleton

Use this as the template for each `*.test.ts`:

```ts
import {
  TestAdapter,
  setEnvVariables,
} from "@chainlink/external-adapter-framework/util/testing-utils";
import * as nock from "nock";
// import FakeTimers from '@sinonjs/fake-timers'         // for WS / time-based tests
// import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
// import { mockWebSocketProvider, MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
import { mockUpstreamSuccess, mockUpstreamFailure } from "./fixtures"; // your fixtures

describe("execute", () => {
  let testAdapter: TestAdapter;
  let oldEnv: NodeJS.ProcessEnv;
  let spy: jest.SpyInstance; // Date.now, or remove if not needed

  beforeAll(async () => {
    // snapshot env
    oldEnv = JSON.parse(JSON.stringify(process.env));

    // set only what's needed
    process.env.API_KEY = process.env.API_KEY ?? "test-api-key";
    process.env.RPC_URL = process.env.RPC_URL ?? "http://localhost:8545";
    process.env.BACKGROUND_EXECUTE_MS = "10000"; // Use default 10s to match production behavior
    // Note: Using 10s prevents flooding upstream services and matches production defaults
    // other adapter-specific envs...

    // freeze time for deterministic cache/snapshots
    const mockDate = new Date("2001-01-01T11:11:11.111Z");
    spy = jest.spyOn(Date, "now").mockReturnValue(mockDate.getTime());

    // import adapter and disable rate limiting when it interferes with tests
    const adapter = (await import("../../src")).adapter;
    adapter.rateLimiting = undefined;

    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
      // clock: FakeTimers.install(),                     // for WS/time-based tests
    });
  });

  afterAll(async () => {
    setEnvVariables(oldEnv);
    await testAdapter.api.close();
    nock.restore();
    nock.cleanAll();
    spy.mockRestore();
    // testAdapter.clock?.uninstall()                    // if using FakeTimers
  });

  describe("happy path", () => {
    it("returns success", async () => {
      const data = { endpoint: "price", base: "ETH", quote: "USD" };
      mockUpstreamSuccess();

      const response = await testAdapter.request(data);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchSnapshot();
    });
  });

  describe("validation errors", () => {
    it("fails on missing base", async () => {
      const response = await testAdapter.request({
        endpoint: "price",
        quote: "USD",
      });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchSnapshot();
    });

    it("fails on empty request", async () => {
      const response = await testAdapter.request({});
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchSnapshot();
    });
  });

  describe("upstream failures", () => {
    it("maps upstream 5xx to adapter error", async () => {
      mockUpstreamFailure();
      const response = await testAdapter.request({
        endpoint: "price",
        base: "ETH",
        quote: "USD",
      });
      expect(response.statusCode).toBe(502);
      expect(response.json()).toMatchSnapshot();
    });
  });
});
```

#### Setup Breakdown

1. **Environment Variable Snapshot**: Always snapshot before modifying

   ```ts
   oldEnv = JSON.parse(JSON.stringify(process.env));
   ```

2. **Required Environment Variables**: Use fallback values (`??`) for optional env vars

   ```ts
   process.env.API_KEY = process.env.API_KEY ?? "fake-api-key";
   process.env.BACKGROUND_EXECUTE_MS = "10000"; // Use default 10s to match production behavior
   // ⚠️ IMPORTANT: Always use default (10000ms = 10s) or a reasonable value
   // Setting this too low can flood upstream services and get your requests blocked
   ```

3. **Time Mocking**: Essential for deterministic snapshots

   ```ts
   const mockDate = new Date("2001-01-01T11:11:11.111Z");
   spy = jest.spyOn(Date, "now").mockReturnValue(mockDate.getTime());
   ```

4. **Adapter Initialization**: Always disable rate limiting

   ```ts
   const adapter = (await import("./../../src")).adapter;
   adapter.rateLimiting = undefined;
   testAdapter = await TestAdapter.startWithMockedCache(adapter, {
     testAdapter: {} as TestAdapter<never>,
   });
   ```

5. **Request Pattern**: Use `testAdapter.request()`, validate status code, use snapshots
   ```ts
   const response = await testAdapter.request({ base: "ETH", quote: "USD" });
   expect(response.statusCode).toBe(200);
   expect(response.json()).toMatchSnapshot();
   ```

#### Cache Management (Advanced)

For tests that need cache clearing between test cases:

```ts
afterEach(() => {
  nock.cleanAll();
  const keys = testAdapter.mockCache?.cache.keys();
  if (keys) {
    for (const key of keys) {
      testAdapter.mockCache?.delete(key);
    }
  }
});
```

---

### 3. Testing SubscriptionTransport with Background Execution (CRITICAL)

**For adapters using `SubscriptionTransport` (HTTP REST with polling OR WebSocket):**

Subscription transports work differently from simple `HttpTransport`. They use background execution to periodically fetch data and populate a cache. The transport type determines your test pattern:

#### Pattern 1: HTTP SubscriptionTransport with afterEach Cache Clearing (RECOMMENDED)

**Best for HTTP REST adapters with SubscriptionTransport** (like `the-network-firm`, adapters with OAuth/auth state):

```ts
describe("execute", () => {
  let testAdapter: TestAdapter;
  let oldEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env));
    // ... set env vars ...

    const adapter = (await import("./../../src")).adapter;
    adapter.rateLimiting = undefined;
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    });
  });

  afterEach(() => {
    // Clear nock mocks
    nock.cleanAll();

    // Clear the EA cache between tests
    const keys = testAdapter.mockCache?.cache.keys();
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key);
      }
    }
  });

  afterAll(async () => {
    setEnvVariables(oldEnv);
    await testAdapter.api.close();
    nock.restore();
    nock.cleanAll();
    spy.mockRestore();
  });

  describe("endpoint tests", () => {
    it("should return success", async () => {
      const data = { endpoint: "price", fundId: 8 };
      mockApiResponse();

      // First call triggers background execution
      await testAdapter.request(data);
      // Second call retrieves cached result
      const response = await testAdapter.request(data);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchSnapshot();
    });
  });
});
```

**Why this works:**

- `afterEach` clears both nock mocks AND cache after every test
- Each test starts with clean state (no cached data, no cached auth tokens)
- Double-call pattern ensures cache is populated before checking results, wait at least 10 seconds before second call
- Prevents test interference and non-deterministic errors

**When to use:**

- HTTP adapters with `SubscriptionTransport`
- Adapters with OAuth or authentication that caches tokens
- When tests may interfere with each other due to shared state

#### Pattern 2: WebSocket with beforeAll Cache Warming

**Best for WebSocket adapters** (like `tp`, `data-engine`, `finalto`, `twosigma`):

```ts
describe("websocket", () => {
  let mockWsServer: MockWebsocketServer | undefined;
  let testAdapter: TestAdapter;

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env));
    process.env.WS_API_ENDPOINT = wsEndpoint;

    mockWebSocketProvider(WebSocketClassProvider);
    mockWsServer = mockWebSocketServer(wsEndpoint);

    const adapter = (await import("./../../src")).adapter;
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    });

    // Warm the cache: send initial requests and wait for cache to fill
    await testAdapter.request(data1);
    await testAdapter.request(data2);
    await testAdapter.waitForCache(2); // Wait for N subscriptions
  });

  afterAll(async () => {
    setEnvVariables(oldEnv);
    mockWsServer?.close();
    testAdapter.clock?.uninstall();
    await testAdapter.api.close();
  });

  describe("tests", () => {
    it("should return success", async () => {
      // Single call works - cache was warmed in beforeAll
      const response = await testAdapter.request(data1);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchSnapshot();
    });
  });
});
```

**Why this works:**

- WebSocket connections are long-lived and shared across tests
- Warm cache once in `beforeAll`, reuse for all tests
- `waitForCache()` ensures background executor has populated cache
- No need to reconnect WebSocket for each test

#### Pattern 3: Double-Call Pattern (LEGACY - Use afterEach Instead)

**This pattern is older and less recommended** but may still be seen in some adapters:

```ts
it("should return success", async () => {
  const data = { endpoint: "price", fundId: 8 };
  mockApiResponse();

  // First call: triggers background executor
  await testAdapter.request(data);

  // Second call: retrieves cached result
  const response = await testAdapter.request(data);

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchSnapshot();
});
```

**Why it's less preferred:**

- More verbose (2 calls per test)
- Doesn't prevent test interference
- Auth tokens/state still cached across tests
- Can cause non-deterministic snapshot failures

**Prefer afterEach cache clearing (Pattern 1) instead.**

#### Comparison: HttpTransport vs SubscriptionTransport

| Transport Type                   | Background Execution | Test Pattern                  | Examples                             |
| -------------------------------- | -------------------- | ----------------------------- | ------------------------------------ |
| **HttpTransport**                | No                   | Single call, no special setup | `streamex`                           |
| **SubscriptionTransport (HTTP)** | Yes                  | afterEach cache clearing      | `the-network-firm`, `asseto-finance` |
| **SubscriptionTransport (WS)**   | Yes                  | beforeAll cache warming       | `tp`, `data-engine`, `finalto`       |

#### Determining Which Transport Your Adapter Uses

Check your adapter's transport file:

```ts
// HttpTransport - No background execution
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    /* ... */
  },
  parseResponse: (params, response) => {
    /* ... */
  },
});

// SubscriptionTransport - Has background execution
class MyTransport extends SubscriptionTransport<HttpTransportTypes> {
  async backgroundHandler(context, entries) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)));
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS);
  }
}
```

**If you see `SubscriptionTransport` and `backgroundHandler`**, use Pattern 1 (afterEach) or Pattern 2 (beforeAll warm-up).  
**If you see `HttpTransport`**, single-call pattern with no special setup is fine.

---

### 4. WebSocket / streaming–specific pattern (EAF)

For WS endpoints (like `coinmetrics-lwba`, `dxfeed`, `tp`, `finalto`, etc.):

- **Additional setup in `beforeAll`**:

```ts
const wsEndpoint = "ws://localhost:9090/your-path";

let mockWsServer: MockWebsocketServer | undefined;

beforeAll(async () => {
  oldEnv = JSON.parse(JSON.stringify(process.env));
  process.env.WS_API_ENDPOINT = wsEndpoint;
  process.env.WS_SUBSCRIPTION_TTL = "5000";
  process.env.CACHE_MAX_AGE = "5000";
  process.env.CACHE_POLLING_MAX_RETRIES = "0";
  process.env.WS_SUBSCRIPTION_UNRESPONSIVE_TTL = "180000";
  process.env.API_KEY = "fake-api-key";

  mockWebSocketProvider(WebSocketClassProvider);
  mockWsServer = mockYourWebSocketServer(wsEndpoint); // from fixtures

  const adapter = (await import("../../src")).adapter;
  adapter.rateLimiting = undefined;

  testAdapter = await TestAdapter.startWithMockedCache(adapter, {
    clock: FakeTimers.install(),
    testAdapter: {} as TestAdapter<never>,
  });

  // warm the cache so background execute starts
  await testAdapter.request({
    endpoint: "your-ws-endpoint" /* other params */,
  });
  await testAdapter.waitForCache(); // or waitForCache(n) for multiple subscriptions
});

afterAll(async () => {
  setEnvVariables(oldEnv);
  mockWsServer?.close();
  testAdapter.clock?.uninstall();
  await testAdapter.api.close();
});
```

- **Tests**:
  - Happy path: call `testAdapter.request(payload)` and snapshot.
  - Validation: `{}`, missing fields, etc. -> expect `400`.
  - Invariant violation / unusual messages:
    - Advance fake clock: `testAdapter.clock.tick(1000)` or `await runAllUntilTime(testAdapter.clock, 91000)`
    - Request again and snapshot.
  - Heartbeat/TTL updates: advance clock and verify cache still valid.

#### Socket.IO Pattern

For adapters using `socket.io-client`:

```ts
import { SocketServerMock } from "socket.io-mock-ts";

beforeAll(async () => {
  const socket = new SocketServerMock();
  jest.doMock("socket.io-client", () => ({
    io: () => socket,
  }));

  // Emit mock events
  socket.clientMock.emit("initial_token_states", [
    {
      id: "FRAX/USD",
      baseSymbol: "FRAX",
      quoteSymbol: "USD",
      price: 0.9950774676498447,
    },
  ]);

  // Continue with adapter setup...
});
```

#### Multiple WebSocket Servers

For adapters with multiple WebSocket endpoints:

```ts
let mockWsServerCrypto: MockWebsocketServer | undefined;
let mockWsServerForex: MockWebsocketServer | undefined;

beforeAll(async () => {
  mockWsServerCrypto = mockCryptoWebSocketServer(wsEndpoint + "/crypto");
  mockWsServerForex = mockForexWebSocketServer(wsEndpoint + "/forex");
  // ...
});

afterAll(async () => {
  mockWsServerCrypto?.close();
  mockWsServerForex?.close();
  // ...
});
```

---

### 4. On-chain / complex dependency pattern

For adapters heavily using `ethers`, `@solana/web3.js`, or custom classes (like `solana-functions`, `token-balance`, `por-address-list`):

- **Mock external libraries** at top of test:

```ts
jest.mock("ethers", () => {
  const actual = jest.requireActual("ethers");
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      providers: {
        JsonRpcProvider: jest.fn().mockImplementation(() => ({
          getBlockNumber: jest.fn().mockResolvedValue(1000),
        })),
      },
      Contract: jest.fn().mockImplementation(() => ({
        decimals: jest.fn().mockResolvedValue(8),
        latestAnswer: jest.fn().mockResolvedValue(5000000000n),
      })),
    },
  };
});
```

or, for Solana:

```ts
jest.mock("@solana/web3.js", () => ({
  PublicKey: jest.fn().mockImplementation(() => ({})),
  Connection: jest.fn().mockImplementation(() => ({
    getAccountInfo: jest.fn().mockResolvedValue({ lamports: 123_000_000_000 }),
  })),
}));
```

- **Class-level behavior** (e.g. account readers) is controlled via `jest.spyOn` and custom implementations per test case.

---

### 5. Fixtures design (EAF)

- **Inputs and outputs must strictly match** the YAML `required_ea_requests_responses_schemas`.
- Snapshot responses; they must **match the YAML-required schemas exactly**. Use the DP response provided by the YAML spec, no need to make a real request to the DP
- Put **all HTTP/WS mocks** into `fixtures.ts`:
  - One function per scenario: `mockStakeSuccess`, `mockWalletListResponseSuccess`, `mockBedRockResponseSuccess`, etc.
  - Use `nock` for REST calls and `MockWebsocketServer` helper for WS. set the nock in package.json
  - Use `.persist()` for mocks that should survive multiple requests.
- Keep fixtures:
  - **Deterministic** (fixed timestamps, no randomness).
  - **Small enough** for readable snapshots; if payloads are large, normalize or pick key fields before snapshotting.
  - **Reusable**: Create parameterized functions when possible (e.g., `mockResponseSuccess(assetId: string)`).

#### Example HTTP fixture:

```ts
export const mockResponseSuccess = (): nock.Scope =>
  nock("https://api.example.com", { encodedQueryParams: true })
    .get("/api/price")
    .query({ symbol: "ETH", convert: "USD" })
    .reply(200, () => ({ ETH: { price: 10000 } }), [
      "Content-Type",
      "application/json",
      "Connection",
      "close",
    ])
    .persist();

export const mockResponseFailure = (): nock.Scope =>
  nock("https://api.example.com", { encodedQueryParams: true })
    .get("/api/price")
    .query({ symbol: "ETH", convert: "USD" })
    .reply(500, { error: "Internal Server Error" })
    .persist();

export const mockResponseWithHeaders = (): nock.Scope =>
  nock("https://api.example.com", {
    encodedQueryParams: true,
    reqheaders: {
      "x-api-key": "fake-api-key",
      Authorization: "Bearer fake-token",
    },
  })
    .get("/api/data")
    .reply(200, { data: "success" })
    .persist();
```

#### Example RPC/Blockchain fixture:

```ts
import { AdapterRequest } from "@chainlink/ea-bootstrap";

export const mockRPCResponse = (): nock.Scope =>
  nock("https://test-rpc-url:443", { encodedQueryParams: true })
    .persist()
    .post("/", {
      method: "eth_chainId",
      params: [],
      id: /^\d+$/,
      jsonrpc: "2.0",
    })
    .reply(200, (_, request: AdapterRequest) => ({
      jsonrpc: "2.0",
      id: request.id,
      result: "0x89", // Polygon chain ID
    }))
    .post("/", {
      method: "eth_call",
      params: [{ to: "0x...", data: "0x..." }, "latest"],
      id: /^\d+$/,
      jsonrpc: "2.0",
    })
    .reply(200, (_, request: AdapterRequest) => ({
      jsonrpc: "2.0",
      id: request.id,
      result:
        "0x0000000000000000000000000000000000000000000000000e1b77935f500bea",
    }));
```

#### Example WebSocket fixture:

```ts
import { MockWebsocketServer } from "@chainlink/external-adapter-framework/util/testing-utils";

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false });
  mockWsServer.on("connection", (socket) => {
    socket.on("message", (message) => {
      const parsed = JSON.parse(message as string);

      // Handle subscription messages
      if (parsed.type === "subscribe") {
        const { base, quote } = parsed;
        socket.send(
          JSON.stringify({
            type: "price_update",
            base,
            quote,
            price: 1.0539,
            timestamp: "2023-03-08T02:31:00.000Z",
          })
        );
      }

      // Handle heartbeat
      if (parsed.type === "heartbeat") {
        setTimeout(() => {
          socket.send(
            JSON.stringify({ type: "heartbeat", timestamp: Date.now() })
          );
        }, 10000);
      }
    });
  });

  return mockWsServer;
};
```

#### Fixtures Best Practices

1. **Deterministic Data**: Use fixed timestamps, no randomness
2. **Persistent Mocks**: Use `.persist()` for mocks that should survive multiple requests
3. **Dynamic Responses**: Use functions for responses that need to vary based on request
4. **Error Scenarios**: Create separate fixtures for different error cases
5. **Header Matching**: Use `reqheaders` for API key/auth validation
6. **Query Parameters**: Use `.query()` for GET requests with query strings
7. **Reusable Functions**: Create parameterized fixture functions for flexibility

---

### 6. Test matrix you should always cover (EAF)

Run test result
execute the tests

```bash
  cd external-adapters-js && yarn install && yarn setup
  cd external-adapters-js && yarn clean && yarn build
  export adapter=[adapter-name]
  yarn test $adapter/test/integration
```

For each EAF endpoint you expose:

- **Happy path**
  - At least one test per distinct request "shape" (e.g., different `type`, `network`, `chainId`, etc.).
  - Symbol overrides (when applicable).
  - Multiple endpoints (if adapter has multiple).
  - Expected status code: `200`.
- **Validation**
  - Empty body `{}` / missing required fields / invalid combinations.
  - Invalid data types.
  - Expected status code: `400`.
- **Upstream failure**
  - HTTP 5xx errors → adapter should return `502`.
  - HTTP 4xx errors → adapter should return appropriate error.
  - Invalid JSON responses / missing expected fields.
  - Expected status codes: `502`, `504`, etc.
- **Edge cases**
  - Boundary values (empty lists, zero balances, extreme decimals).
  - Case sensitivity (if applicable).
  - Inverse pairs (for price adapters).
  - Stale data handling.
  - Empty/null responses.
  - For WS: subscription TTL + invariant-violation handling + heartbeat updates.

#### Example Test Structure

```ts
describe("execute", () => {
  // ... setup ...

  describe("price endpoint", () => {
    describe("happy path", () => {
      it("should return success for valid pair", async () => {
        mockResponseSuccess();
        const response = await testAdapter.request({
          base: "ETH",
          quote: "USD",
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchSnapshot();
      });

      it("should handle symbol overrides", async () => {
        mockResponseSuccess();
        const response = await testAdapter.request({
          base: "ZZZ",
          quote: "USD",
          overrides: { adapterName: { ZZZ: "ETH" } },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchSnapshot();
      });
    });

    describe("validation errors", () => {
      it("should fail on empty request", async () => {
        const response = await testAdapter.request({});
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchSnapshot();
      });

      it("should fail on missing base", async () => {
        const response = await testAdapter.request({ quote: "USD" });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchSnapshot();
      });
    });

    describe("upstream failures", () => {
      it("should handle 5xx errors", async () => {
        mockResponseFailure();
        const response = await testAdapter.request({
          base: "ETH",
          quote: "USD",
        });
        expect(response.statusCode).toBe(502);
        expect(response.json()).toMatchSnapshot();
      });

      it("should handle invalid response format", async () => {
        mockInvalidResponse();
        const response = await testAdapter.request({
          base: "ETH",
          quote: "USD",
        });
        expect(response.statusCode).toBe(502);
        expect(response.json()).toMatchSnapshot();
      });
    });

    describe("edge cases", () => {
      it("should handle inverse pairs", async () => {
        mockResponseSuccess();
        const response = await testAdapter.request({
          base: "IDR",
          quote: "USD",
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchSnapshot();
      });

      it("should handle stale prices", async () => {
        mockStalePriceResponse();
        const response = await testAdapter.request({
          base: "JPY",
          quote: "USD",
        });
        expect(response.statusCode).toBe(502);
        expect(response.json()).toMatchSnapshot();
      });
    });
  });
});
```

#### Testing Subscription Deduplication (WebSocket)

```ts
it("should only subscribe once for same pair", async () => {
  const dataLowercase = { base: "eth", quote: "usd" };
  const dataUppercase = { base: "ETH", quote: "USD" };

  const response1 = await testAdapter.request(dataLowercase);
  const response2 = await testAdapter.request(dataUppercase);

  expect(response1.json()).toMatchSnapshot();
  expect(response2.json()).toMatchSnapshot();

  // Verify subscription set only has one entry
  expect(transport.subscriptionSet.getAll()).toHaveLength(1);
});
```

---

### 7. Key Best Practices

#### Core Setup

- **Always mock time**: `jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())`
- **Disable rate limiting**: `adapter.rateLimiting = undefined`
- **Use snapshots**: `expect(response.json()).toMatchSnapshot()`
- **Environment fallbacks**: `process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'`

#### ⚠️ CRITICAL: Background Execution Configuration

**NEVER set `BACKGROUND_EXECUTE_MS` to 0, minimum 10000!**

- **Tests & Production**: Always use the default value of `10000ms` (10 seconds) or a reasonable value
- **Why**: Setting this too low (e.g., every few milliseconds) will flood upstream services with requests
- **Consequence**: Upstream services will block your requests, potentially affecting feeds
- **Default**: Framework default is 10 seconds (`10000ms`), which is safe for both tests and production

Examples:

```ts
// ❌ BAD - This will flood services and get blocked
process.env.BACKGROUND_EXECUTE_MS = "10"; // Every 10ms!
process.env.BACKGROUND_EXECUTE_MS = "0"; // Disabled - not realistic for production

// ✅ GOOD - Use default value (matches production behavior)
process.env.BACKGROUND_EXECUTE_MS = "10000"; // Every 10 seconds (default)
// Or don't set it at all - framework will use default
```

#### Transport-Specific Patterns

**For SubscriptionTransport (HTTP REST with polling):**

- **Use `afterEach` cache clearing**: Prevents test interference and non-deterministic errors
- **Single-call pattern**: With `afterEach` cleanup, single calls work fine
- **Clear both nock AND cache**: `nock.cleanAll()` + clear `testAdapter.mockCache`

**For SubscriptionTransport (WebSocket):**

- **Warm cache in `beforeAll`**: Call `await testAdapter.request()` + `await testAdapter.waitForCache()`
- **Use FakeTimers**: `FakeTimers.install()` for time-based tests
- **Single-call pattern**: Cache is warmed once, reused for all tests

**For HttpTransport:**

- **Single-call pattern**: No special setup needed
- **Optional `afterEach`**: Only if tests share state

#### Organization

- **Group tests by endpoint**: Use nested `describe` blocks
- **Test data organization**: Use constants (e.g., `TEST_SUCCESS_ASSET_ID`)
- **Fixture reusability**: Create parameterized fixture functions

---

### 8. Complex Test Utilities

For adapters with complex test scenarios, create utility files:

```ts
// utils/utilFunctions.ts
import { TestAdapter } from "@chainlink/external-adapter-framework/util/testing-utils";

export const clearTestCache = (testAdapter: TestAdapter) => {
  const keys = testAdapter.mockCache?.cache.keys();
  if (keys) {
    for (const key of keys) {
      testAdapter.mockCache?.delete(key);
    }
  }
};

// utils/testConfig.ts
export const TEST_SUCCESS_ASSET_ID = "KUSPUM";
export const TEST_FAILURE_ASSET_ID = "INVALID";
export const TEST_URL = "https://test-api.example.com";
```

---

### 9. Checklist for New Integration Tests

- [ ] Created `test/integration/` directory
- [ ] Created `adapter.test.ts` with proper structure
- [ ] Created `fixtures.ts` with mock responses
- [ ] Set up `beforeAll` with environment variables
- [ ] Mocked time for deterministic snapshots
- [ ] Disabled rate limiting
- [ ] Set `BACKGROUND_EXECUTE_MS = '10000'` (use default 10s)
- [ ] Chose correct test pattern based on transport type:
  - [ ] HttpTransport: Single-call pattern
  - [ ] SubscriptionTransport (HTTP): afterEach cache clearing
  - [ ] SubscriptionTransport (WebSocket): beforeAll cache warming
- [ ] Implemented happy path tests
- [ ] Implemented validation error tests
- [ ] Implemented upstream failure tests
- [ ] Implemented edge case tests
- [ ] All tests use snapshots for response validation
- [ ] Proper cleanup in `afterAll`
- [ ] Tests are deterministic and repeatable
- [ ] WebSocket tests use `FakeTimers` (if applicable)
- [ ] WebSocket cache is warmed with `waitForCache()` (if applicable)

---

### 10. Examples Reference

#### Recent Framework-Style Examples:

- `packages/sources/tp/test/integration/adapter.test.ts` - WebSocket price adapter
- `packages/sources/finalto/test/integration/adapter.test.ts` - WebSocket multi-endpoint
- `packages/sources/the-network-firm/test/integration/adapter.test.ts` - REST multi-endpoint
- `packages/sources/liveart/test/integration/adapter.test.ts` - REST with utilities
- `packages/sources/streamex/test/integration/adapter.test.ts` - REST simple
- `packages/sources/data-engine/test/integration/adapter.test.ts` - WebSocket
- `packages/sources/aleno/test/integration/adapter-socket.test.ts` - Socket.IO
- `packages/sources/finage/test/integration/adapter.test.ts` - REST multi-endpoint
- `packages/sources/tiingo/test/integration/adapter-ws.test.ts` - WebSocket complex

---

### Summary

If you follow this EAF-only template (file layout, `TestAdapter` bootstrap, env/time mocking, fixtures, and the test matrix), you'll be aligned with how the most recent `@sources` EAF adapters are tested and will be able to generate robust integration suites consistently.

**Key principles:**

1. **Use `TestAdapter`** from `@chainlink/external-adapter-framework/util/testing-utils`
2. **Deterministic tests** through time mocking and fixed data
3. **Comprehensive coverage** of happy paths, errors, and edge cases
4. **Proper fixtures** with reusable mock functions
5. **Clean setup/teardown** with environment variable management
6. **Snapshot testing** for response validation
7. **Fake timers** for WebSocket/time-based tests
8. **Do NOT** test unit tests scenarios, language/framework basics, mocks themselves, or trivial/non-business behaviors.
