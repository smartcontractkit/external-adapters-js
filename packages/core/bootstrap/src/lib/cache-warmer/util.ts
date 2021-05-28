import hash from 'object-hash'
import { WarmupSubscribedPayload } from './actions'
import { get } from './config'
import { omit } from 'lodash'

const conf = get()
export function getSubscriptionKey(request: WarmupSubscribedPayload): string {
  return hash(omit(request, ['parent', 'children']), conf.hashOpts)
}
