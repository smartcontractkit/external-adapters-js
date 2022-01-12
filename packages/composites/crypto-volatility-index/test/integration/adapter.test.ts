import { AdapterRequest, Execute } from '@chainlink/types'
import * as cryptoVolatilityAdapter from '../../src/index'
import { BigNumber } from 'ethers'
import nock from 'nock'
import {
  mockBookDataEndpointBTC,
  mockBookDataEndpointETH,
  mockCurrencyEndpointBTC,
  mockCurrencyEndpointETH,
  mockInstrumentsBTC,
  mockInstrumentsETH,
  mockTokenAllocationResponseETH,
  mockTokenAllocationResponseBTC,
} from './fixtures'

// Fix time information for moment JS
process.env.TZ = 'GMT'
Date.now = () => new Date('2021-07-21T10:20:30Z').getTime()

jest.mock('moment', () => {
  const moment = jest.requireActual('moment')
  moment.weekday = () => 5
  moment.unix = (expiration?: number) =>
    expiration
      ? {
          weekday: () => 5,
        }
      : moment.unix()
  return moment
})

const mockBigNum = BigNumber.from(2000)
const mockUpdatedAt = BigNumber.from(1624227602)

jest.mock('@chainlink/ea-reference-data-reader', () => ({
  getRpcLatestRound: () => ({
    answer: mockBigNum,
    updatedAt: mockUpdatedAt,
  }),
}))

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.TIINGO_DATA_PROVIDER_URL =
    process.env.TIINGO_DATA_PROVIDER_URL || 'http://localhost:3000'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  let execute: Execute
  const id = '1'

  beforeAll(async () => {
    execute = await cryptoVolatilityAdapter.execute
  })

  describe('with isAdaptive true', () => {
    const data: AdapterRequest = {
      id,
      data: {
        source: 'tiingo',
        address: 'mock-address',
        contract: '0x1B58B67B2b2Df71b4b0fb6691271E83A0fa36aC5',
        isAdaptive: true,
        multiply: 1e18,
      },
    }

    mockTokenAllocationResponseBTC()
    mockTokenAllocationResponseETH()
    mockBookDataEndpointBTC()
    mockBookDataEndpointETH()
    mockCurrencyEndpointBTC()
    mockCurrencyEndpointETH()
    mockInstrumentsBTC()
    mockInstrumentsETH()

    it('should return success', async () => {
      const resp = await execute(data)
      expect(resp).toMatchSnapshot()
    })
  })

  describe('with isAdaptive false', () => {
    const data: AdapterRequest = {
      id,
      data: {
        source: 'tiingo',
        address: 'mock-address',
        contract: '0x1B58B67B2b2Df71b4b0fb6691271E83A0fa36aC5',
        isAdaptive: false,
      },
    }

    mockTokenAllocationResponseBTC()
    mockTokenAllocationResponseETH()
    mockBookDataEndpointBTC()
    mockBookDataEndpointETH()
    mockCurrencyEndpointBTC()
    mockCurrencyEndpointETH()
    mockInstrumentsBTC()
    mockInstrumentsETH()

    it('should return success', async () => {
      const resp = await execute(data)
      expect(resp).toMatchSnapshot()
    })
  })
})
