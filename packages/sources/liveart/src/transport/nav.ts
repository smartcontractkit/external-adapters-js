import { HttpTransport } from '@chainlink/external-adapter-framework/transports/http'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config/config'
import { inputParameters } from '../endpoint/nav'

export interface ResponseSchema {
  asset_id: string
  asset_info_category: string
  asset_info_creator: string
  asset_info_title: string
  asset_info_year_created: string
  asset_info_description: string
  asset_info_url: string
  current_estimated_nav_usd: string
  current_estimated_nav_updated_at: string
  token_total_shares: number
  token_current_estimated_nav_per_share_usd: string
  offering_price_usd: string
  success: boolean
  message: string
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

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, adapterSettings) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: adapterSettings.API_BASE_URL,
          url: `/asset/${param.assetId}`,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    return params.map((param: TypeFromDefinition<typeof inputParameters.definition>) => {
      if (param.assetId !== response.data.asset_id) {
        return {
          params: param,
          response: {
            errorMessage: `Mismatched asset_id in response. Expected ${param.assetId}, got ${response.data.asset_id}`,
            statusCode: 502,
          },
        }
      }
      const responseData = response.data

      if (!responseData.success)
        return {
          params: param,
          response: {
            errorMessage: responseData.message,
            statusCode: 502,
          },
        }

      const navString = responseData.token_current_estimated_nav_per_share_usd
      const nav = parseFloat(navString)

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
  },
})
