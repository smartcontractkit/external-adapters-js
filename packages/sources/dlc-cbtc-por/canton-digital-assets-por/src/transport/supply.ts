import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/supply'
import { ApiResponse, Instrument } from '../types'

export type { Instrument }

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ApiResponse
  }
}

/**
 * Parses a decimal string and scales it to an integer with the given precision.
 * Throws on invalid input - never returns default values.
 *
 * @example
 * parseDecimalString("11.7127388", 10) → 117127388000n
 * parseDecimalString("100", 8) → 10000000000n
 */
export function parseDecimalString(value: string, decimals: number): bigint {
  const [whole, frac = ''] = value.split('.')
  return BigInt(whole + frac.padEnd(decimals, '0').slice(0, decimals))
}

/**
 * Extracts and calculates the CBTC total supply from the API response.
 * Uses BigInt arithmetic to avoid precision loss with large values.
 * Throws on invalid input - never returns default values.
 */
export function calculateTotalSupply(instruments: Instrument[]): string {
  if (!instruments || instruments.length === 0) {
    throw new Error('No instruments found in API response')
  }

  const cbtcInstrument = instruments.find((i) => i.symbol === 'CBTC')
  if (!cbtcInstrument) {
    throw new Error('CBTC instrument not found in API response')
  }

  if (!cbtcInstrument.totalSupply?.trim()) {
    throw new Error('CBTC totalSupply is missing or empty')
  }

  if (cbtcInstrument.decimals == null || cbtcInstrument.decimals < 0) {
    throw new Error('CBTC decimals is missing or invalid')
  }

  return parseDecimalString(cbtcInstrument.totalSupply, cbtcInstrument.decimals).toString()
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) =>
    params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.CANTON_API_URL,
        method: 'GET',
      },
    })),
  parseResponse: (params, res) =>
    params.map((param) => {
      try {
        const result = calculateTotalSupply(res.data.instruments)
        return {
          params: param,
          response: {
            result,
            data: { result },
          },
        }
      } catch (error) {
        return {
          params: param,
          response: {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            statusCode: 502,
          },
        }
      }
    }),
})
