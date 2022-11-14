import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { customSettings } from '../config'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'

export const inputParameters: InputParameters = {}

interface ResponseSchema {
  num_currencies: string
  num_currencies_active: string
  num_currencies_inactive: string
  num_currencies_dead: string
  num_currencies_new: string
  market_cap: string
  transparent_market_cap: string
  '1d': PriceChange
  '7d': PriceChange
  '30d': PriceChange
  '365d': PriceChange
  ytd: PriceChange
}

export interface PriceChange {
  market_cap_change: string
  market_cap_change_pct: string
  transparent_market_cap_change: string
  transparent_market_cap_change_pct: string
  volume: string
  volume_change: string
  volume_change_pct: string
  spot_volume: string
  spot_volume_change: string
  spot_volume_change_pct: string
  derivative_volume: string
  derivative_volume_change: string
  derivative_volume_change_pct: string
  transparent_volume: string
  transparent_volume_change: string
  transparent_volume_change_pct: string
  transparent_spot_volume: string
  transparent_spot_volume_change: string
  transparent_spot_volume_change_pct: string
  transparent_derivative_volume: string
  transparent_derivative_volume_change: string
  transparent_derivative_volume_change_pct: string
  volume_transparency: {
    grade: string
    volume: string
    volume_change: string
    volume_change_pct: string
  }[]
}

export type EndpointTypes = {
  Request: {
    Params: EmptyObject
  }
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: { key: string }
    ResponseBody: ResponseSchema
  }
}

const restEndpointTransport = new RestTransport<EndpointTypes>({
  prepareRequest: (_, config) => {
    const baseURL = config.API_ENDPOINT
    const params = {
      key: config.API_KEY,
    }

    return {
      baseURL,
      url: '/global-ticker',
      params,
    }
  },
  parseResponse: (_, res) => {
    return {
      data: {
        result: Number(res.data.market_cap),
      },
      statusCode: 200,
      result: Number(res.data.market_cap),
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'globalmarketcap',
  transport: restEndpointTransport,
  inputParameters,
})
