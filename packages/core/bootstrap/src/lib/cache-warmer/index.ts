import { AdapterRequest, Execute, MakeWSHandler, Middleware } from '@chainlink/types'
import { Store } from 'redux'
import { withMiddleware } from '../../index'
import { logger } from '../external-adapter'
import { getFeedId } from '../metrics/util'
import * as util from '../util'
import { getWSConfig } from '../ws/config'
import { getSubsId, RootState as WSState } from '../ws/reducer'
import * as actions from './actions'
import { RootState } from './reducer'
import { getSubscriptionKey } from './util'
import { omit } from 'lodash'

export * as actions from './actions'
export * as epics from './epics'
export * as reducer from './reducer'

interface WSInput {
  store: Store<WSState>
  makeWSHandler?: MakeWSHandler
}

export const withCacheWarmer = (
  warmerStore: Store<RootState>,
  middleware: Middleware[],
  ws: WSInput,
) => (rawExecute: Execute): Middleware => async (execute) => async (input: AdapterRequest) => {
  const isWarmerActive =
    util.parseBool(process.env.CACHE_ENABLED) &&
    util.parseBool(process.env.EXPERIMENTAL_WARMUP_ENABLED)
  if (!isWarmerActive) return await execute(input)

  const wsConfig = getWSConfig()
  const warmupSubscribedPayload: actions.WarmupSubscribedPayload = {
    id: input.id,
    // We need to initilialize the middleware on every beat to open a connection with the cache
    // Wrapping `rawExecute` as `execute` is already wrapped with the default middleware. Warmer doesn't need every default middleware
    executeFn: async (input: AdapterRequest) =>
      await (await withMiddleware(rawExecute, middleware))(input),
    data: omit(input, ['debug', 'rateLimitMaxAge']),
  }

  if (wsConfig.enabled && ws.makeWSHandler) {
    // If WS is available, and there is an active subscription, warmer should not be active
    const wsHandler = await ws.makeWSHandler()
    const wsSubscriptionKey = getSubsId(wsHandler.subscribe(input))
    const cacheWarmerKey = getSubscriptionKey(warmupSubscribedPayload)

    // Could happen that a subscription is still loading. If that's the case, warmer will open a subscription. If the WS becomes active, on next requests warmer will be unsubscribed
    const isActiveWSSubscription = ws.store.getState().subscriptions.all[wsSubscriptionKey]?.active
    // If there is a WS subscription active, warmup subscription (if exists) should be removed, and not play for the moment
    const isActiveCWSubsciption = warmerStore.getState().subscriptions[cacheWarmerKey]

    if (isActiveWSSubscription) {
      if (isActiveCWSubsciption) {
        logger.info(`Active WS feed detected: disabling cache warmer for ${getFeedId(input)}`)
        warmerStore.dispatch(actions.warmupUnsubscribed({ key: cacheWarmerKey }))
      }

      return await execute(input)
    }
  }

  // In case WS is not available, or WS has no active subscription, warmer should be active
  // Dispatch subscription only if execute was succesful
  const result = await execute(input)

  const warmupExecutePayload: actions.WarmupExecutePayload = { ...warmupSubscribedPayload, result }
  warmerStore.dispatch(actions.warmupExecute(warmupExecutePayload))

  return result
}
