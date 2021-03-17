import { AdapterRequest } from '@chainlink/types'
import hash from 'object-hash'
import { get } from './config'

const conf = get()
export function getSubscriptionKey(request: AdapterRequest): string {
  return hash(request, conf.hashOpts)
}
