import { omit } from 'lodash'
import { WarmupExecutePayload, WarmupSubscribedPayload } from './actions'
import { get } from './config'
import { hash } from '../util'

const conf = get()
export function getSubscriptionKey(
  request: WarmupSubscribedPayload | WarmupExecutePayload,
): string {
  return hash(
    omit(request, ['id', 'parent', 'children', 'result', 'batchablePropertyPath']),
    conf.hashOpts,
  )
}
