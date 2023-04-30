import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, getApiEndpoint, getApiHeaders } from '../config'
import overrides from '../config/overrides.json'

export const inputParameters = new InputParameters({
  base: {
    description: 'The symbol of symbols of the currency to query',
    aliases: ['from', 'coin'],
    type: 'string',
    required: true,
  },
  hours: {
    description: 'Number of hours to get VWAP for',
    type: 'number',
    default: 24,
  },
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    type: 'string',
  },
})

interface Response {
  timestamp: string
  price: number
  volume_24h: number
  market_cap: number
}

type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  Provider: {
    RequestBody: never
    ResponseBody: Response[]
  }
}

const formatUtcDate = (date: Date) => date.toISOString().split('T')[0]

const restEndpointTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const coin = param.coinid ?? param.base
      const url = `v1/tickers/${coin?.toLowerCase()}/historical`

      const baseURL = getApiEndpoint(config)

      const endDate = new Date()
      const subMs = param.hours * 60 * 60 * 1000
      const startDate = new Date(endDate.getTime() - subMs)

      const reqParams = {
        start: formatUtcDate(startDate),
        interval: `${param.hours}h`,
      }

      return {
        params: [{ coinid: param.coinid, base: param.base, hours: param.hours }],
        request: {
          baseURL,
          url,
          method: 'GET',
          params: reqParams,
          headers: getApiHeaders(config),
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      return {
        params: { coinid: param.coinid, base: param.base, hours: param.hours },
        response: {
          data: {
            result: res.data[0].price,
          },
          result: res.data[0].price,
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport: restEndpointTransport,
  inputParameters,
  overrides: overrides.coinpaprika,
})
