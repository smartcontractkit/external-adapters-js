import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { reserveTransport } from '../../src/transport/reserve'
import { AminaFake } from './amina'

export { UUID_PATTERN } from './amina'

export type ReserveResponseBody = {
  statusCode?: number
  result?: number
  data?: { result: number; ripcord: boolean }
  errorMessage?: string
  timestamps?: {
    providerDataRequestedUnixMs?: number
    providerDataReceivedUnixMs?: number
    providerIndicatedTimeUnixMs?: number
  }
}

type ReserveResponse = { statusCode: number; json: () => unknown }

const DEFAULT_ENV: Record<string, string> = {
  API_ENDPOINT: 'https://integration-test.aminagroup.io',
  AMINA_USER_ID: '12345678',
  AMINA_PASSWORD: 'super-secret-password',
  AMINA_HMAC_SECRET: 'super-secret-hmac',
  AMINA_AGREEMENT_NUMBER: '123456-1',
  AMINA_PORTFOLIO: '157769305',
  AMINA_ISIN: 'US0378331005',
  // Both intervals are shortened so the real background loop turns over inside
  // a test. The empty interval is what an idle pass sleeps; the non-empty one is
  // what a pass that handled a subscription sleeps.
  BACKGROUND_EXECUTE_MS: '300',
  BACKGROUND_EXECUTE_MS_HTTP: '150',
}

const CACHE_WAIT_TIMEOUT_MS = 20_000
const IDLE_PASS_TIMEOUT_MS = 5_000

export type StartOptions = {
  env?: Record<string, string>
  loggerFactory?: unknown
}

// The tests do not measure the rate limiter; a passthrough keeps a scenario
// from sleeping in it. The adapter's own rate-limiting configuration stays
// untouched, so a probe can still assert it.
const passThroughRateLimiter = {
  waitForRateLimit: () => Promise.resolve(),
  msUntilNextExecution: () => 0,
}

/**
 * Boots the real adapter with the real framework loop and the two provider
 * endpoints faked in-process. The endpoint has no input parameters, so every
 * scenario shares one cache key and one subscription entry.
 *
 * `prepare` clears that state and then waits for a background pass that starts
 * with nothing to read. The framework awaits each pass before scheduling the
 * next, so when such a pass starts the previous scenario's fetch has already
 * finished, and the pass is now sleeping `BACKGROUND_EXECUTE_MS_HTTP`. The
 * interceptors of the next scenario are installed inside that sleep, and a
 * pass counter guards that no pass started in between.
 */
export class ReserveHarness {
  readonly fake = new AminaFake()
  testAdapter!: TestAdapter
  private oldEnv: NodeJS.ProcessEnv = {}
  private passStarts = 0
  private idlePassResolvers: Array<() => void> = []
  private originalBackgroundHandler = reserveTransport.backgroundHandler.bind(reserveTransport)

  async start(options: StartOptions = {}): Promise<void> {
    this.oldEnv = JSON.parse(JSON.stringify(process.env))
    setEnvVariables({ ...DEFAULT_ENV, ...options.env })
    nock.disableNetConnect()

    const adapter = (await import('./../../src')).adapter
    const dependencies = {
      rateLimiter: passThroughRateLimiter as never,
      ...(options.loggerFactory ? { loggerFactory: options.loggerFactory as never } : {}),
    }
    this.testAdapter = await TestAdapter.startWithMockedCache(
      adapter,
      { testAdapter: {} as TestAdapter<never> },
      dependencies,
    )

    this.fake.install()

    reserveTransport.backgroundHandler = async (context, entries) => {
      this.passStarts += 1
      if (entries.length === 0) {
        for (const resolve of this.idlePassResolvers.splice(0)) {
          resolve()
        }
      }
      return this.originalBackgroundHandler(context, entries)
    }
  }

  async prepare(configure?: (fake: AminaFake) => void): Promise<void> {
    this.clearSubscription()

    const passesBefore = this.passStarts
    await this.waitForIdlePass()
    if (this.passStarts !== passesBefore + 1) {
      throw new Error('a background pass started while the scenario was prepared')
    }

    // The idle pass observed above is sleeping, and passes never overlap, so no
    // writer can refill the cache or take a queued reply from here on.
    this.clearCache()
    this.fake.reset()
    configure?.(this.fake)
  }

  async request(): Promise<{ response: ReserveResponse; body: ReserveResponseBody }> {
    const response = await this.testAdapter.request({ endpoint: 'reserve' })
    return { response, body: response.json() as ReserveResponseBody }
  }

  /**
   * The adapter retries transient provider failures with its own backoff (2 s,
   * then 4 s), which outlives the framework cache poll. When the first request
   * times out, wait for the background pass to write its response and read that
   * response from the cache with one more request.
   */
  async requestAndWaitForResult(): Promise<{
    response: ReserveResponse
    body: ReserveResponseBody
  }> {
    const first = await this.testAdapter.request({ endpoint: 'reserve' })
    if (first.statusCode === 504) {
      await this.waitForCachedResponse()
    }
    return this.request()
  }

  async stop(): Promise<void> {
    reserveTransport.backgroundHandler = this.originalBackgroundHandler
    setEnvVariables(this.oldEnv)
    await this.testAdapter.api.close()
    nock.cleanAll()
    nock.enableNetConnect()
  }

  private clearSubscription(): void {
    const transport = this.testAdapter.adapter.endpoints[0].transportRoutes.get(
      'default_single_transport',
    ) as { subscriptionSet?: { map: Map<string, unknown> } } | undefined
    transport?.subscriptionSet?.map.clear()
  }

  private clearCache(): void {
    this.testAdapter.mockCache?.cache.clear()
  }

  private waitForIdlePass(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('the background loop did not reach an idle pass'))
      }, IDLE_PASS_TIMEOUT_MS)
      this.idlePassResolvers.push(() => {
        clearTimeout(timer)
        resolve()
      })
    })
  }

  private async waitForCachedResponse(): Promise<void> {
    const deadline = Date.now() + CACHE_WAIT_TIMEOUT_MS
    while ((this.testAdapter.mockCache?.cache.size ?? 0) === 0) {
      if (Date.now() > deadline) {
        throw new Error('the background pass did not write a response to the cache')
      }
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
}
