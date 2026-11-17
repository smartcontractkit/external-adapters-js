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

const DEFAULT_ENV: Record<string, string> = {
  API_ENDPOINT: 'https://integration-test.aminagroup.io',
  AMINA_USER_ID: '12345678',
  AMINA_PASSWORD: 'super-secret-password',
  AMINA_HMAC_SECRET: 'super-secret-hmac',
  AMINA_AGREEMENT_NUMBER: '123456-1',
  AMINA_PORTFOLIO: '157769305',
  AMINA_ISIN: 'US0378331005',
  BACKGROUND_EXECUTE_MS: '150',
}

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
 * scenario shares one cache key and one subscription entry: `prepare` clears
 * both and then waits for a background pass that has nothing to read. Passes
 * never overlap, so once that pass has started the previous scenario's fetch is
 * finished and cannot race the interceptors installed next.
 */
export class ReserveHarness {
  readonly fake = new AminaFake()
  testAdapter!: TestAdapter
  private oldEnv: NodeJS.ProcessEnv = {}
  private idleBackgroundPasses = 0
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

    reserveTransport.backgroundHandler = async (context, entries) => {
      if (entries.length === 0) {
        this.idleBackgroundPasses += 1
      }
      return this.originalBackgroundHandler(context, entries)
    }
  }

  async prepare(configure?: (fake: AminaFake) => void): Promise<void> {
    this.clearCachedState()
    await this.waitForIdleBackgroundPass()
    nock.cleanAll()
    this.fake.reset()
    configure?.(this.fake)
    this.fake.install()
  }

  async request(): Promise<{
    response: { statusCode: number; json: () => unknown }
    body: ReserveResponseBody
  }> {
    const response = await this.testAdapter.request({ endpoint: 'reserve' })
    return { response, body: response.json() as ReserveResponseBody }
  }

  async stop(): Promise<void> {
    reserveTransport.backgroundHandler = this.originalBackgroundHandler
    setEnvVariables(this.oldEnv)
    await this.testAdapter.api.close()
    nock.cleanAll()
    nock.enableNetConnect()
  }

  private clearCachedState(): void {
    this.testAdapter.mockCache?.cache.clear()
    const transport = this.testAdapter.adapter.endpoints[0].transportRoutes.get(
      'default_single_transport',
    ) as { subscriptionSet?: { map: Map<string, unknown> } } | undefined
    transport?.subscriptionSet?.map.clear()
  }

  private async waitForIdleBackgroundPass(): Promise<void> {
    const target = this.idleBackgroundPasses + 1
    const deadline = Date.now() + 5_000
    while (this.idleBackgroundPasses < target) {
      if (Date.now() > deadline) {
        throw new Error('the background loop did not reach an idle pass')
      }
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
  }
}
