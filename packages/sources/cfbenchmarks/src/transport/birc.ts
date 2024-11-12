import {
  HttpTransport,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { latestUpdateIsWithinLast24h, tenorInRange } from './utils'
import { AdapterCustomError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/birc'

const logger = makeLogger('CFBenchmarksBIRCEndpoint')
export enum VALID_TENORS {
  SIRB = 'SIRB',
  '1W' = '1W',
  '2W' = '2W',
  '3W' = '3W',
  '1M' = '1M',
  '2M' = '2M',
  '3M' = '3M',
  '4M' = '4M',
  '5M' = '5M',
}

export interface RequestParams {
  tenor: string
}
export interface ProviderResponse {
  serverTime: string
  error: string
  payload: {
    tenors: {
      SIRB: string
      '1W': string
      '2W': string
      '3W': string
      '1M': string
      '2M': string
      '3M': string
      '4M': string
      '5M': string
    }
    time: number
    amendTime: number
    repeatOfPreviousValue: boolean
  }[]
}

export type BircTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponse
  }
}
class CfBenchmarksBIRCTransport extends HttpTransport<BircTransportTypes> {
  override async initialize(
    dependencies: TransportDependencies<BircTransportTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester = new Requester(
      dependencies.rateLimiter,
      adapterSettings,
    )
  }
}

export const transport = new CfBenchmarksBIRCTransport({
  prepareRequests: (params, config) => {
    const { API_USERNAME, API_PASSWORD, API_ENDPOINT } = config
    const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')

    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: API_ENDPOINT,
          url: '/v1/curves',
          headers: {
            Authorization: `Basic ${encodedCreds}`,
          },
          params: {
            id: 'BIRC',
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const latestUpdate = res.data.payload[res.data.payload.length - 1]
      const key = param.tenor as VALID_TENORS
      const value = Number(latestUpdate.tenors[key])

      if (!latestUpdateIsWithinLast24h(latestUpdate.time)) {
        const warning = 'Latest update from response is not in current day %o'
        logger.warn(warning, { latestUpdate })
      }

      if (!tenorInRange(value)) {
        const error = 'Tenor is out of range (-1 to 1)'
        logger.error(error, { value, tenor: key })
        throw new AdapterCustomError({ message: error })
      }

      return {
        params: param,
        response: {
          result: value,
          data: {
            result: value,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(res.data.serverTime).getTime(),
          },
        },
      }
    })
  },
})
