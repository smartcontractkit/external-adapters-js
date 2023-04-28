import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, getApiEndpoint, getApiHeaders } from '../config'
import overrides from '../config/overrides.json'

const logger = makeLogger('CoinPaprika Global Batched')

export const inputParameters = new InputParameters({
  market: {
    aliases: ['to', 'quote'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  resultPath: {
    description: 'The path to the result within the asset quote in the provider response',
    required: false,
    type: 'string',
    options: ['market_cap_', '_dominance_percentage'],
  },
})

export interface GlobalResponseBody {
  market_cap_usd: number
  volume_24h_usd: number
  bitcoin_dominance_percentage: number
  cryptocurrencies_number: number
  market_cap_ath_value: number
  market_cap_ath_date: string
  volume_24h_ath_value: number
  volume_24h_ath_date: string
  market_cap_change_24h: number
  volume_24h_change_24h: number
  last_updated: number
}

export type GlobalEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: GlobalResponseBody
  }
}

// Maps the input parameter value with the value that will be set in the requestContext.data object
const resultPathMap = {
  globalmarketcap: 'market_cap_',
  dominance: '_dominance_percentage',
} as const

const marketMap: { [key: string]: string } = {
  BTC: 'bitcoin',
}

const httpTransport = new HttpTransport<GlobalEndpointTypes>({
  prepareRequests: (params, settings) => {
    return {
      params,
      request: {
        baseURL: getApiEndpoint(settings),
        url: '/v1/global',
        method: 'GET',
        headers: getApiHeaders(settings),
      },
    }
  },
  parseResponse: (params, res) => {
    const data = res.data

    return params.map((p) => {
      if (!data) {
        logger.warn(`The data provider did not send any value for this request`)
        return {
          params: p,
          response: {
            errorMessage: `The data provider did not send any value when requesting the global endpoint`,
            statusCode: 502,
          },
        }
      }

      const propertyPath =
        p.resultPath === '_dominance_percentage'
          ? `${marketMap[p.market.toUpperCase()]}${p.resultPath}`
          : `${p.resultPath}${p.market.toLowerCase()}`

      const rawResult = data[propertyPath as keyof GlobalResponseBody]
      if (!rawResult) {
        return {
          params: p,
          response: {
            errorMessage: `A value for "${propertyPath}" was not found in the provider response`,
            statusCode: 502,
          },
        }
      }

      const result = Number(rawResult)
      return {
        params: p,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'globalmarketcap',
  aliases: ['dominance'],
  transport: httpTransport,
  requestTransforms: [
    (request) => {
      if (!request.requestContext.data.resultPath) {
        const endpoint =
          (request.body.data as { endpoint: keyof typeof resultPathMap }).endpoint ||
          request.requestContext.endpointName
        request.requestContext.data.resultPath = resultPathMap[endpoint]
      }
    },
  ],
  inputParameters,
  overrides: overrides.coinpaprika,
})
