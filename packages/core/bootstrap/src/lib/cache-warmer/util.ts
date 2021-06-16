import { omit } from 'lodash'
import hash from 'object-hash'
import { WarmupExecutePayload, WarmupSubscribedPayload } from './actions'
import { get } from './config'

const conf = get()
export function getSubscriptionKey(
  request: WarmupSubscribedPayload | WarmupExecutePayload,
): string {
  return hash(omit(request, ['id', 'parent', 'children', 'result', 'batchKey']), conf.hashOpts)
}
