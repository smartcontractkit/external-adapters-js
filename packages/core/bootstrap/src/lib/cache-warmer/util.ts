import hash from 'object-hash'
import { WarmupSubscribedPayload } from './actions'
import { get } from './config'

const conf = get()
export function getSubscriptionKey(request: WarmupSubscribedPayload): string {
  return hash(request, conf.hashOpts)
}
