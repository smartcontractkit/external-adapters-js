import { BaseEndpointTypes, ResponseData } from '../endpoint/realized-vol'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('TiingoRealizedVol HTTP')
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

const TIINGO_REALIZED_VOL_PREFIX = 'real_vol_'
const TIINGO_REALIZED_VOL_URL = `tiingo/crypto/prices`

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: unknown
    ResponseBody: RealizedVolResponseBody[]
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
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
            statusCode: 502,
          },
        }
      })
    }

    return params.map((entry) => {
      const { realVol1Day, realVol7Day, realVol30Day, date } = res.data[0].realVolData[0]
      const data: ResponseData = {
        realVol1Day: realVol1Day,
        realVol7Day: realVol7Day,
        realVol30Day: realVol30Day,
      }
      return {
        params: entry,
        response: {
          data: data,
          result: data[entry.resultPath] ? data[entry.resultPath] : null,
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(date).getTime(),
          },
        },
      }
    })
  },
})
