import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { assertError, setEnvVariables } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'
import { makeConfig } from '../../src/config'
import { getIdFromInputs, inputParameters } from '../../src/endpoint/values'
import { latestUpdateIsCurrentDay, tenorInRange } from '../../src/endpoint/birc'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.API_USERNAME = process.env.API_USERNAME || 'test_username'
  process.env.API_PASSWORD = process.env.API_PASSWORD || 'test_password'
})

afterAll(() => {
  setEnvVariables(oldEnv)
})

describe('execute', () => {
  const id = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(id, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, id)
        }
      })
    })
  })

  describe('getIdFromInputs', () => {
    const tests: { name: string; input: AdapterRequest; output: string; useSecondary: boolean }[] =
      [
        {
          name: 'uses index if present',
          input: { id, data: { index: 'BRTI' } },
          output: 'BRTI',
          useSecondary: false,
        },
        {
          name: 'uses from/to if present',
          input: { id, data: { from: 'ETH', to: 'USD' } },
          output: 'ETHUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'uses aliases base/quote if present',
          input: { id, data: { base: 'USDT', quote: 'USD' } },
          output: 'USDTUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'ignores from/to if index present',
          input: { id, data: { index: 'LINKUSD_RTI', from: 'ETH', to: 'USD' } },
          output: 'LINKUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'maps BTC/USD to BRTI',
          input: { id, data: { from: 'BTC', to: 'USD' } },
          output: 'BRTI',
          useSecondary: false,
        },
        {
          name: 'maps SOL/USD to SOLUSD_RTI if not using secondary endpoint',
          input: { id, data: { from: 'SOL', to: 'USD' } },
          output: 'SOLUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'maps SOL/USD to U_SOLUSD_RTI if using secondary endpoint',
          input: { id, data: { from: 'SOL', to: 'USD' } },
          output: 'U_SOLUSD_RTI',
          useSecondary: true,
        },
      ]

    tests.forEach((test) => {
      it(`${test.name}`, async () => {
        const validator = new Validator(test.input, inputParameters)
        const config = makeConfig()
        config.useSecondary = test.useSecondary
        expect(getIdFromInputs(config, validator)).toEqual(test.output)
      })
    })
  })

  describe('tenorInRange', () => {
    test('should return true when tenor is within range', () => {
      expect(tenorInRange(0)).toBe(true)
      expect(tenorInRange(-1)).toBe(true)
      expect(tenorInRange(1)).toBe(true)
      expect(tenorInRange(0.755)).toBe(true)
    })

    test('should return false when tenor is outside of range', () => {
      expect(tenorInRange(-1.1)).toBe(false)
      expect(tenorInRange(1.1)).toBe(false)
      expect(tenorInRange(2)).toBe(false)
      expect(tenorInRange(-2)).toBe(false)
    })
  })
})

describe('latestUpdateIsCurrentDay', () => {
  it('returns true when the latest update is on the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString()
    const currentDayTimestampMs = new Date(currentDayIsoString).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(currentDayTimestampMs)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns false when the latest update is not on the current day in UTC time zone', () => {
    const yesterdayIsoString = new Date(Date.now() - 86400000).toISOString()
    const yesterdayTimestampMs = new Date(yesterdayIsoString).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(yesterdayTimestampMs)
    expect(latestUpdateIsCurrentDayResult).toBe(false)
  })

  it('returns false when the input timestamp is not valid', () => {
    const invalidTimestamp = NaN
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(invalidTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(false)
  })

  it('returns true when the latest update is on the first millisecond of the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString().substring(0, 10)
    const currentDayFirstMsTimestamp = new Date(`${currentDayIsoString}T00:00:00.000Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(currentDayFirstMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns true when the latest update is on the last millisecond of the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString().substring(0, 10)
    const currentDayLastMsTimestamp = new Date(`${currentDayIsoString}T23:59:59.999Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(currentDayLastMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })
})
