import {
  HttpTransport,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { config } from '../../config'

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

export class CfBenchmarksBIRCTransport extends HttpTransport<RestEndpointTypes> {
  override async initialize(
    dependencies: TransportDependencies<RestEndpointTypes>,
    adapterSettings: RestEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester = new Requester(dependencies.rateLimiter, {
      ...adapterSettings,
      RETRY: adapterSettings.BIRC_RETRY,
      REQUESTER_SLEEP_BEFORE_REQUEUEING_MS: adapterSettings.BIRC_RETRY_DELAY_MS,
    })
  }
}
