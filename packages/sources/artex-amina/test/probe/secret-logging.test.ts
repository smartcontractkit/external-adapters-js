import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  ACCESS_TOKEN_1,
  AGREEMENT_NUMBER,
  API_HOST,
  HMAC_SECRET,
  MATCHING_ISIN,
  PASSWORD,
  POSITIONS_FAILURE_BODY,
  USER_ID,
} from '../fixtures'
import { mockAuth, mockPositions } from '../integration/fixtures'

type LogEntry = {
  level: string
  args: unknown[]
}

const entries: LogEntry[] = []
const makeLog = (level: string) => {
  return (...args: unknown[]) => {
    entries.push({ level, args })
  }
}
const logger = {
  fatal: makeLog('fatal'),
  error: makeLog('error'),
  warn: makeLog('warn'),
  info: makeLog('info'),
  debug: makeLog('debug'),
  trace: makeLog('trace'),
  msgPrefix: 'test',
}
const loggerFactory = { child: () => logger }

const flatten = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }
  if (value instanceof Error) {
    const cause = (value as Error & { cause?: unknown }).cause
    return [value.name, value.message, cause === undefined ? '' : flatten(cause)].join(': ')
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

describe('trace-level secret logging', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    LoggerFactoryProvider.set(loggerFactory)
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.LOG_LEVEL = 'trace'
    process.env.API_ENDPOINT = API_HOST
    process.env.AMINA_USER_ID = USER_ID
    process.env.AMINA_PASSWORD = PASSWORD
    process.env.AMINA_HMAC_SECRET = HMAC_SECRET
    process.env.AMINA_AGREEMENT_NUMBER = AGREEMENT_NUMBER
    process.env.BACKGROUND_EXECUTE_MS = '100000'

    nock.disableNetConnect()
    const adapter = (await import('../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    if (testAdapter) {
      await testAdapter.api.close()
    }
    nock.enableNetConnect()
    nock.cleanAll()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('logs the provider failure without the password, HMAC secret, or access token', async () => {
    const portfolio = '920000005'
    mockAuth()
    mockPositions(portfolio, 0, POSITIONS_FAILURE_BODY, 400)

    const response = await testAdapter.request({
      endpoint: 'reserves',
      portfolio,
      isin: MATCHING_ISIN,
    })

    expect(response.statusCode).toBe(502)

    const errorLogs = entries.filter((entry) => entry.level === 'error')
    expect(errorLogs.length).toBeGreaterThan(0)
    const text = errorLogs.map((entry) => entry.args.map(flatten).join(' ')).join('\n')
    expect(text).not.toContain(PASSWORD)
    expect(text).not.toContain(HMAC_SECRET)
    expect(text).not.toContain(ACCESS_TOKEN_1)
  })
})
