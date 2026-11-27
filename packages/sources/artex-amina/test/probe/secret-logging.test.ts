import { censor } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  ACCESS_TOKEN_1,
  ACCESS_TOKEN_2,
  AGREEMENT_NUMBER,
  API_HOST,
  AUTH_FAILURE_BODY,
  HMAC_SECRET,
  MATCHING_ISIN,
  ONE_MATCH_PAGE,
  PASSWORD,
  POSITIONS_FAILURE_BODY,
  REFRESH_BODY,
  REFRESH_TOKEN_1,
  REFRESH_TOKEN_2,
  USER_ID,
} from '../fixtures'
import { mockAuth, mockPositions } from '../integration/fixtures'

type LogEntry = {
  level: string
  args: unknown[]
}

const LEVEL_WEIGHT: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
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

const configuredLevel = (): string => (process.env.LOG_LEVEL ?? 'info').toLowerCase()

// The production pino logger drops entries below LOG_LEVEL. In particular, the
// framework Requester's trace line is upstream and is not asserted here.
const emittedEntries = (): LogEntry[] => {
  const minimum = LEVEL_WEIGHT[configuredLevel()] ?? LEVEL_WEIGHT.info
  return entries.filter((entry) => (LEVEL_WEIGHT[entry.level] ?? 0) >= minimum)
}

// The production logger censors each argument with JSON.stringify and the
// adapter's sensitive-setting censor list before pino serializes it. This keeps
// the Error's enumerable config and cause, as the pino hook does.
const serialize = (value: unknown): string => {
  const censored = censor(value, CensorList.getAll())
  if (typeof censored === 'string') {
    return censored
  }
  const json = JSON.stringify(censored)
  return json === undefined ? String(censored) : json
}

const expectNoSecrets = (): void => {
  const emitted = emittedEntries()
  expect(emitted.length).toBeGreaterThan(0)
  const text = emitted.map((entry) => entry.args.map(serialize).join(' ')).join('\n')
  for (const secret of [
    PASSWORD,
    HMAC_SECRET,
    ACCESS_TOKEN_1,
    ACCESS_TOKEN_2,
    REFRESH_TOKEN_1,
    REFRESH_TOKEN_2,
  ]) {
    expect(text).not.toContain(secret)
  }
}

describe('default-level secret logging', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.LOG_LEVEL = 'info'
    process.env.API_ENDPOINT = API_HOST
    process.env.AMINA_USER_ID = USER_ID
    process.env.AMINA_PASSWORD = PASSWORD
    process.env.AMINA_HMAC_SECRET = HMAC_SECRET
    process.env.AMINA_AGREEMENT_NUMBER = AGREEMENT_NUMBER
    process.env.BACKGROUND_EXECUTE_MS = '100000'

    nock.disableNetConnect()
    const adapter = (await import('../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(
      adapter,
      {
        testAdapter: {} as TestAdapter<never>,
      },
      { loggerFactory },
    )
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

  it('logs the provider failure without any credential', async () => {
    entries.length = 0
    const portfolio = '920000005'
    mockAuth()
    mockPositions(portfolio, 0, POSITIONS_FAILURE_BODY, 400)

    const response = await testAdapter.request({
      endpoint: 'reserves',
      portfolio,
      isin: MATCHING_ISIN,
    })

    expect(response.statusCode).toBe(502)
    expectNoSecrets()
  })

  it('logs no refresh token when a refresh is rejected and a new login succeeds', async () => {
    entries.length = 0
    const portfolio = '920000006'
    mockAuth()
    mockPositions(portfolio, 0, ONE_MATCH_PAGE, 401)
    mockAuth(API_HOST, AUTH_FAILURE_BODY, 401)
    mockAuth(API_HOST, REFRESH_BODY)
    mockPositions(portfolio, 0, ONE_MATCH_PAGE)

    const response = await testAdapter.request({
      endpoint: 'reserves',
      portfolio,
      isin: MATCHING_ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(123.4567)
    expectNoSecrets()
  })
})
