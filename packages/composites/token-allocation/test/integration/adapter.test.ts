import { AdapterRequest, Execute } from '@chainlink/types'
import * as tokenAllocationAdapter from "../../src/index" 
import { Requester } from "@chainlink/ea-bootstrap"

const jobRunID = 1
const sources = {
    "amberdata": {
        providerUrlEnvVar: `AMBERDATA_DATA_PROVIDER_URL`
    }, 
    "coinapi": {
        providerUrlEnvVar: `COINAPI_DATA_PROVIDER_URL`
    }, 
    "coingecko": {
        providerUrlEnvVar: `COINGECKO_DATA_PROVIDER_URL`,
        isBatched: true 
    }, 
    "coinmarketcap": {
        providerUrlEnvVar: `COINMARKETCAP_DATA_PROVIDER_URL`,
        isBatched: true
    }, 
    "coinpaprika": {
        providerUrlEnvVar: `COINPAPRIKA_DATA_PROVIDER_URL`
    }, 
    "cryptocompare": {
        providerUrlEnvVar: `CRYPTOCOMPARE_DATA_PROVIDER_URL`,
        isBatched: true
    }, 
    "kaiko": {
        providerUrlEnvVar: `KAIKO_DATA_PROVIDER_URL`
    }, 
    "nomics": {
        providerUrlEnvVar: `NOMICS_DATA_PROVIDER_URL`,
        isBatched: true
    }, 
    "tiingo": {
        providerUrlEnvVar: `TIINGO_DATA_PROVIDER_URL`
    }
}
Requester.request = (request: any) => {
    const source = sources[request.baseURL]
    const { quote } = request.data.data 
    if(source.isBatched || (request.baseURL === "coinapi" && request.data.data.quote === "USD")) {
        return {
            "jobRunID": "1",
            "data": {
                "data": {
                    "results": [
                        [
                            {
                                "data": {
                                    "base": "WBTC",
                                    "quote": quote
                                }
                            },
                            200
                        ],
                        [
                            {
                                "data": {
                                    "base": "DAI",
                                    "quote": quote
                                }
                            },
                            400
                        ]
                    ]
                }
            },
            "statusCode": 200
        }
    }
    return {
        "jobRunID": "1",
        "data": {
          "result": 130.27
        },
        "result": 130.27,
        "statusCode": 200
    }
}
const getPriceRequest = (source: string, method = "price", quote = "EUR"): AdapterRequest => ({ 
    id: jobRunID,
    data: {
      source,
      "allocations": [
        {
          "symbol": "wBTC",
          "balance": 100000000,
          "decimals": 8
        },
        {
          "symbol": "DAI",
          "balance": "1000000000000000000"
        }
      ],
      quote,
      method 
    }
})

let oldEnv: NodeJS.ProcessEnv

describe('execute', () => {
  let execute: Execute 
  const id = '1'

  beforeAll(async () => {
    execute = await tokenAllocationAdapter.makeExecute()
    oldEnv = JSON.parse(JSON.stringify(process.env))
    for (const source of Object.keys(sources)) {
        const { providerUrlEnvVar } = sources[source]
        process.env[providerUrlEnvVar] = source
    }
  })

  afterAll(() => {
    process.env = oldEnv
  })

  describe("price method", () => {
    for(const source of Object.keys(sources)) {
        const request = getPriceRequest(source)
        it(`should return the correct price for source ${source}`, async () => {
            const resp = await execute(request)
            expect(resp).toMatchSnapshot()
        })
    }

    it('should return the correct price using a batched request when pulling data from coin API and the quote is USD', async () => {
        const request = getPriceRequest("coinapi", "price", "USD")
        const resp = await execute(request)
        expect(resp).toMatchSnapshot()
    })
  })

  describe("marketcap method", () => {
    for(const source of Object.keys(sources)) {
        const request = getPriceRequest(source, "marketcap")
        it(`should return the correct price for source ${source}`, async () => {
            const resp = await execute(request)
            expect(resp).toMatchSnapshot()
        })
    }

    it('should return the correct price using a batched request when pulling data from coin API and the quote is USD', async () => {
        const request = getPriceRequest("coinapi", "marketcap", "USD")
        const resp = await execute(request)
        expect(resp).toMatchSnapshot()
    })
  })
})
