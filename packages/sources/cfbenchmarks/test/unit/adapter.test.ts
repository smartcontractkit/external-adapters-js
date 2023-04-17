import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { latestUpdateIsCurrentDay, tenorInRange } from '../../src/endpoint/rest/birc'
import { getIdFromBaseQuote } from '../../src/utils'
import { createAdapter, setEnvVariables } from '../integration/setup'

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
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>

  beforeAll(async () => {
    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    fastify?.close(done())
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
    ]

    requests.forEach((request) => {
      it(`${request.name}`, async () => {
        const makeRequest = () =>
          req
            .post('/')
            .send(request.testData)
            .set('Accept', '*/*')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /json/)

        const response = await makeRequest()
        expect(response.statusCode).toEqual(400)
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

describe('getIdFromBaseQuote', () => {
  const tests: {
    name: string
    input: { data: { base: string; quote: string } }
    output: string
    useSecondary: boolean
  }[] = [
    {
      name: 'uses base/quote if present',
      input: { data: { base: 'ETH', quote: 'USD' } },
      output: 'ETHUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'uses aliases base/quote if present',
      input: { data: { base: 'USDT', quote: 'USD' } },
      output: 'USDTUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'maps BTC/USD quote BRTI',
      input: { data: { base: 'BTC', quote: 'USD' } },
      output: 'BRTI',
      useSecondary: false,
    },
    {
      name: 'maps SOL/USD quote SOLUSD_RTI if not using secondary endpoint',
      input: { data: { base: 'SOL', quote: 'USD' } },
      output: 'SOLUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'maps SOL/USD quote U_SOLUSD_RTI if using secondary endpoint',
      input: { data: { base: 'SOL', quote: 'USD' } },
      output: 'U_SOLUSD_RTI',
      useSecondary: true,
    },
  ]

  tests.forEach((test) => {
    it(`${test.name}`, async () => {
      const type = test.useSecondary ? 'secondary' : 'primary'
      expect(getIdFromBaseQuote(test.input.data.base, test.input.data.quote, type)).toEqual(
        test.output,
      )
    })
  })
})
