import { AdapterResponse } from '@chainlink/types'

export interface CacheEntry
  extends Pick<
    AdapterResponse,
    'statusCode' | 'data' | 'result' | 'debug' | 'telemetry' | 'providerStatusCode'
  > {
  maxAge: number
}
