import {
  AdapterSettings,
  SettingsDefinitionMap,
} from '@chainlink/external-adapter-framework/config'
import {
  HttpTransport,
  ProviderRequestConfig,
} from '@chainlink/external-adapter-framework/transports'
import {
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { AxiosResponse } from 'axios'
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
  valuation_method: string | null
  success: boolean
  message: string | null
  response_timestamp: string
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
 * Validates and parse the nav_per_share value from the response
 * @param navString Per-share NAV value as a string
 * @returns Parsed NAV value as a number
 */
export function parseNavPerShare(navString: string | null): number {
  if (navString == null) {
    throw new AdapterError({ statusCode: 400, message: 'nav_per_share is null' })
  }

  const nav = Number(navString)
  if (isNaN(nav) || !isFinite(nav) || nav < 0) {
    throw new AdapterError({
      statusCode: 400,
      message: `Invalid nav_per_share value: ${navString}`,
    })
  }

  return nav
}

/**
 * Prepare the requests to be sent to the data provider
 * @param params list of parameters sent to the adapter
 * @param adapterSettings adapter configuration settings containing API base URL and bearer token
 */
export const prepareRequests = (
  params: (typeof inputParameters.validated)[],
  adapterSettings: AdapterSettings<SettingsDefinitionMap>,
): ProviderRequestConfig<HttpTransportTypes>[] => {
  return params.map((param) => {
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

/**
 * Parse the response from the data provider
 * @param params list of parameters sent to the adapter
 * @param response the response from the data provider
 * @returns an array of provider results
 */
export function parseResponse(
  params: any[],
  response: AxiosResponse<ResponseSchema>,
): ProviderResult<HttpTransportTypes>[] {
  // Check that request went through
  if (!response.data) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `The data provider failed to respond for artwork_id=${param.artwork_id}`,
          statusCode: 502,
        },
      }
    })
  }
  if (response.status !== 200 || !response.data.success) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `The data provider failed to return a value for artwork_id=${param.artwork_id}, errorMessage: ${response.data?.message}`,
          statusCode: 502,
        },
      }
    })
  }

  return params.map((param: any) => {
    try {
      if (param.artwork_id !== response.data.artwork_id) {
        throw new AdapterError({
          statusCode: 500,
          message: `Mismatched artwork_id in response. Expected ${param.artwork_id}, got ${response.data.artwork_id}`,
        })
      }

      const nav = parseNavPerShare(response.data.nav_per_share)
      return {
        params: param,
        response: {
          result: nav,
          data: {
            result: nav,
          },
        },
      }
    } catch (error: Error | unknown) {
      return {
        params: param,
        response: {
          errorMessage: `Failed to parse response for artwork_id=${param.artwork_id}. Error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          statusCode: 502,
        },
      }
    }
  })
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests,
  parseResponse,
})
