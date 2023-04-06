import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'

import overrides from '../../config/overrides.json'
import { config } from '../../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('TiingoRealizedVol HTTP')

const TIINGO_REALIZED_VOL_PREFIX = 'real_vol_'
const TIINGO_REALIZED_VOL_URL = `tiingo/crypto/prices`
const TIINGO_REALIZED_VOL_DEFAULT_QUOTE = 'USD'
interface RealizedVolResponseBody {
  baseCurrency: string
  quoteCurrency: string
  realVolData: {
    date: string
    realVol1Day: number
    realVol7Day: number
    realVol30Day: number
  }[]
}

export type RealizedVolResponse = {
  Result: null
  Data: {
    realVol1Day: number
    realVol7Day: number
    realVol30Day: number
  }
}

type RealizedVolRequestParams = {
  base: string
  convert: string
}

const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The base currency to query the realized volatility for',
  },
  convert: {
    aliases: ['to', 'quote'],
    required: false,
    default: TIINGO_REALIZED_VOL_DEFAULT_QUOTE,
    type: 'string',
    description: 'The quote currency to convert the realized volatility to',
  },
} satisfies InputParameters

type RealizedVolEndpointTypes = {
  Request: {
    Params: RealizedVolRequestParams
  }
  Response: RealizedVolResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: unknown
    ResponseBody: RealizedVolResponseBody[]
  }
}
export const httpTransport = new HttpTransport<RealizedVolEndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: TIINGO_REALIZED_VOL_URL,
          params: {
            token: config.API_KEY,
            //prepend real_vol to baseCurrency & quoteCurrency
            baseCurrency: `${TIINGO_REALIZED_VOL_PREFIX}${param.base}`,
            convertCurrency: param.convert,
            consolidateBaseCurrency: true,
          },
        },
      }
    })
  },

  parseResponse: (params, res) => {
    // If no data is returned, return an error. Empty response is usually due to invalid currency pair or invalid API key (or key doesn't have access to the endpoint)
    if (!res?.data.length) {
      return params.map((param) => {
        const errorMessage = `Tiingo provided no data for ${param.base}/${param.convert}`
        logger.warn(errorMessage)
        return {
          params: param,
          response: {
            errorMessage: errorMessage,
            statusCode: 400,
          },
        }
      })
    }

    return params.map((entry) => {
      return {
        params: entry,
        response: {
          data: {
            realVol1Day: res.data[0].realVolData[0].realVol1Day,
            realVol7Day: res.data[0].realVolData[0].realVol7Day,
            realVol30Day: res.data[0].realVolData[0].realVol30Day,
          },
          result: null,
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(res.data[0].realVolData[0].date).getTime(),
          },
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<RealizedVolEndpointTypes>({
  name: 'realized-vol',
  aliases: ['realized-volatility'],
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
