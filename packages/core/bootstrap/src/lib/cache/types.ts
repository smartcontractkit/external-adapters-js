import { AdapterResponse } from '@chainlink/types'

export interface CacheEntry extends Pick<AdapterResponse, 'statusCode' | 'data' | 'result'> {
  maxAge: number
}
