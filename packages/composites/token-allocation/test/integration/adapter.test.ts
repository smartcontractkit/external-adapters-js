import { AdapterRequest, Execute } from '@chainlink/types'
import * as tokenAllocationAdapter from '../../src/index'
import { dataProviderConfig, mockDataProviderResponses } from './fixtures'
import nock from 'nock'

const jobRunID = 1

const getPriceRequest = (source: string, method = 'price', quote = 'EUR'): AdapterRequest => ({
  id: jobRunID,
  data: {
    source,
    allocations: [
      {
        symbol: 'wBTC',
        balance: 100000000,
        decimals: 8,
      },
      {
        symbol: 'DAI',
        balance: '1000000000000000000',
      },
    ],
    quote,
    method,
  },
})

let oldEnv: NodeJS.ProcessEnv

describe('execute', () => {
  let execute: Execute
  const id = '1'

  beforeAll(async () => {
    execute = await tokenAllocationAdapter.makeExecute()
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    for (const source of Object.keys(dataProviderConfig)) {
      const { providerUrlEnvVar, providerUrl } = dataProviderConfig[source]
      process.env[providerUrlEnvVar] = providerUrl
    }
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

  describe('price method', () => {
    mockDataProviderResponses()
    for (const source of Object.keys(dataProviderConfig)) {
      const request = getPriceRequest(source)
      it(`should return the correct price for source ${source}`, async () => {
        const resp = await execute(request)
        expect(resp).toMatchSnapshot()
      })
    }

    it('should return the correct price using a batched request when pulling data from coin API and the quote is USD', async () => {
      const request = getPriceRequest('coinapi', 'price', 'USD')
      const resp = await execute(request)
      expect(resp).toMatchSnapshot()
    })
  })

  describe('marketcap method', () => {
    mockDataProviderResponses()
    for (const source of Object.keys(dataProviderConfig)) {
      const request = getPriceRequest(source, 'marketcap')
      it(`should return the correct price for source ${source}`, async () => {
        const resp = await execute(request)
        expect(resp).toMatchSnapshot()
      })
    }

    it('should return the correct price using a batched request when pulling data from coin API and the quote is USD', async () => {
      const request = getPriceRequest('coinapi', 'marketcap', 'USD')
      const resp = await execute(request)
      expect(resp).toMatchSnapshot()
    })
  })
})
