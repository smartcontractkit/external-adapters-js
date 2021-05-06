
import { AdapterRequest, Execute, MakeWSHandler, Middleware } from '@chainlink/types'
import { Store } from 'redux'
import { RootState } from './reducer'
import * as actions from './actions'
import { getSubscriptionKey } from './util'
import { getSubsId, RootState as WSState } from '../ws/reducer'
import { withMiddleware } from '../../index'
import * as util from '../util'

export * as actions from './actions'
export * as reducer from './reducer'
export * as epics from './epics'

interface WSInput {
  store: Store<WSState>
  makeWSHandler?: MakeWSHandler
}

export const withCacheWarmer = (warmerStore: Store<RootState>, middleware: Middleware[], ws: WSInput) => (rawExecute: Execute): Middleware => async (execute) => async (input: AdapterRequest) => {
  const isWarmerActive = util.parseBool(process.env.CACHE_ENABLED) && util.parseBool(process.env.EXPERIMENTAL_WARMUP_ENABLED)
  if (!isWarmerActive) return await execute(input)

  if (ws.makeWSHandler) {
    // If WS is available, and there is an active subscription, warmer should not be active
    const wsHandler = await ws.makeWSHandler()
    const wsSubscriptionKey = getSubsId(wsHandler.subscribe(input))
    // Could happen that a subscription is still loading. If that's the case, warmer will open a subscription. If the WS becomes active, on next requests warmer will be unsubscribed
    const isActiveWSSubscription = ws.store.getState().subscriptions[wsSubscriptionKey]?.active
    // If there is a WS subscription active, warmup subscription (if exists) should be removed, and not play for the moment
    if (isActiveWSSubscription) {
      warmerStore.dispatch(actions.warmupUnsubscribed({ key: getSubscriptionKey(input) }))
      return await execute(input)
    }
  }

  // In case WS is not available, or WS has no active subscription, warmer should be active
  const result = await execute(input)
  // Dispatch subscription only if execute was succesful
  warmerStore.dispatch(
    actions.warmupSubscribed({
      id: input.id,
      // We need to initilialize the middleware on every beat to open a connection with the cache
      // Wrapping `rawExecute` as `execute` is already wrapped with the default middleware. Warmer doesn't need every default middleware
      executeFn: async (input) => await (await withMiddleware(rawExecute, middleware))(input),
      data: input,
    }),
  )
  return result
}
