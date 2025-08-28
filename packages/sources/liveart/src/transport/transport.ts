import {
  AdapterSettings,
  SettingsDefinitionMap,
} from '@chainlink/external-adapter-framework/config'
import {
  HttpTransport,
  ProviderRequestConfig,
} from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AxiosResponse } from 'axios'

import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { config } from '../config/config'
import { inputParameters } from '../endpoint/nav'

export interface ResponseSchema {
  artwork_id: string
  current_estimated_price_updated_at: string | null
  current_estimated_price: string | null
  total_shares: number | null
  nav_per_share: string | null
  valuation_price_date: string | null
  valuation_price: string | null
  valuation_method: null
  success: boolean
  message: string | null
  response_timestamp: string
}

export interface HealthResponseSchema {
  status: string
  data_status: boolean
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

/**
 *
 * @param params
 * @param adapterSettings
 */
function prepareRequests(
  params: any[],
  adapterSettings: AdapterSettings<SettingsDefinitionMap>,
): ProviderRequestConfig<HttpTransportTypes> | ProviderRequestConfig<HttpTransportTypes>[] {
  return params.map((param: { artwork_id: string }) => {
    return {
      params: [param],
      request: {
        baseURL: adapterSettings.API_BASE_URL,
        url: `/artwork/${param.artwork_id}/price`,
        headers: {
          Authorization: `Bearer ${adapterSettings.BEARER_TOKEN}`,
        },
      },
    }
  })
}

function parseResponse(
  params: any[],
  response: AxiosResponse<ResponseSchema>,
): ProviderResult<HttpTransportTypes>[] {
  return params.map((param: any) => {
    const nav = Number(response.data.nav_per_share)
    return {
      params: param,
      response: {
        result: nav,
        data: {
          result: nav,
        },
      },
    }
  })
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests,
  parseResponse,
})
