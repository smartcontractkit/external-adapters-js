import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../../config'

const logger = makeLogger('BircEndpoint')

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

export const inputParameters = {
  tenor: {
    description: 'The tenor value to pull from the API response',
    type: 'string',
    options: Object.values(VALID_TENORS),
    required: true,
  },
} as const

export interface RequestParams {
  tenor: string
}

interface ProviderResponse {
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

export type RestEndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponse
  }
}

// Tenor must be between -1 and 1
export const tenorInRange = (tenor: number): boolean => tenor >= -1 && tenor <= 1
// Check if time of latest update is in the current day in UTC time
export const latestUpdateIsCurrentDay = (utcTimeOfUpdate: number): boolean => {
  try {
    const latestUpdateDate = new Date(utcTimeOfUpdate)
    const currentDay = new Date()
    return (
      latestUpdateDate.getUTCFullYear() === currentDay.getUTCFullYear() &&
      latestUpdateDate.getUTCMonth() === currentDay.getUTCMonth() &&
      latestUpdateDate.getUTCDate() === currentDay.getUTCDate()
    )
  } catch (error) {
    return false
  }
}

const restTransport = new HttpTransport<RestEndpointTypes>({
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
      const key = param.tenor as VALID_TENORS
      const latestUpdate = res.data.payload[res.data.payload.length - 1]

      if (!latestUpdateIsCurrentDay(latestUpdate.time)) {
        const warning = 'Latest update from response is not in current day'
        logger.warn(warning, { latestUpdate })
      }

      const value = Number(latestUpdate.tenors[key])

      if (!tenorInRange(value)) {
        const errorMessage = 'Tenor is out of range (-1 to 1)'
        logger.error(errorMessage, { value: value, tenor: key })
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
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

export const endpoint = new AdapterEndpoint<RestEndpointTypes>({
  name: 'birc',
  transport: restTransport,
  inputParameters,
})
