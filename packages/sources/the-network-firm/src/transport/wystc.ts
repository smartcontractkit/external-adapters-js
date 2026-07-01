import { PoRProviderResponse } from '@chainlink/external-adapter-framework/adapter/por'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { inputParameters } from './common'

const logger = makeLogger('WystcHTTPTransport')

export interface WystcResponseSchema {
  totalReserves: string
  totalSupply: string
  ripcord: boolean
  ripcordDetails: string[]
  timestamp: string
  ripcordTimestamp: string | null
}

type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: WystcResponseSchema
  }
}

// Decimal-safe ×1e6 scaling via string arithmetic — avoids float imprecision
// e.g. "965051.85" → 965051850000 (parseFloat * 1e6 would give 965051849999.9998)
function scaleDecimalString(value: string): number {
  const SCALE = 6
  const negative = value.startsWith('-')
  const abs = negative ? value.slice(1) : value
  const [intPart, fracPart = ''] = abs.split('.')
  const paddedFrac = fracPart.padEnd(SCALE, '0').slice(0, SCALE)
  const scaled = parseInt(intPart + paddedFrac, 10)
  return negative ? -scaled : scaled
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, settings) => ({
    params,
    request: {
      baseURL: settings.WYSTC_API_ENDPOINT,
      url: '/v1/proof-of-reserves/wystc/snapshot',
      headers: {
        'x-api-key': settings.WYSTC_API_KEY,
      },
    },
  }),
  parseResponse: (params, response) => {
    return params.map((param) => {
      const data = response.data
      const timestamps = {
        providerIndicatedTimeUnixMs: new Date(data.timestamp).getTime(),
      }

      if (data.ripcord) {
        logger.debug(`Ripcord tripped. Details: ${data.ripcordDetails.join(', ')}`)
      }

      const totalReserves = scaleDecimalString(data.totalReserves)
      const totalSupply = scaleDecimalString(data.totalSupply)

      if (isNaN(totalReserves) || isNaN(totalSupply)) {
        return {
          params: param,
          response: {
            errorMessage: 'Failed to parse totalReserves or totalSupply as decimal strings',
            statusCode: 502,
            timestamps,
          },
        }
      }

      return {
        params: param,
        response: {
          result: totalReserves,
          data: {
            result: totalReserves,
            totalReserves,
            totalSupply,
            ripcord: data.ripcord,
            ripcordAsInt: data.ripcord ? 1 : 0,
            ripcordDetails: data.ripcordDetails,
          },
          timestamps,
        },
      }
    })
  },
})
