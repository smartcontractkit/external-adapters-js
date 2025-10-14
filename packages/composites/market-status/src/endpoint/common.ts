import {
  MarketStatusEndpointGenerics,
  MarketStatusResultResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'

export type CompositeMarketStatusResultResponse = MarketStatusResultResponse & {
  Data: {
    source?: string
  }
}

export type BaseMarketStatusEndpointTypes = MarketStatusEndpointGenerics & {
  Response: CompositeMarketStatusResultResponse
  Settings: typeof config.settings
}
