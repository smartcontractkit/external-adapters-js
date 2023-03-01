import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyObject, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../../config'

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
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: EmptyObject
    ResponseBody: ProviderResponse
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
      const value = Number(res.data.payload[res.data.payload.length - 1].tenors[key])
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
