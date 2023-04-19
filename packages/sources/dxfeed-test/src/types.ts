import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from './config'

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}
