import type {
  AdapterData,
  AdapterRequest,
  Execute,
  MakeWSHandler,
  Middleware,
} from '../../../types'
import type { Store } from 'redux'
import { withMiddleware } from '../../../index'
import { logger } from '../../modules/logger'
import * as util from '../../util'
import { getWSConfig } from '../ws/config'
import { getSubsId, RootState as WSState } from '../ws/reducer'
import * as actions from './actions'
import { CacheWarmerState } from './reducer'

export * as config from './config'
export * as actions from './actions'
export * as epics from './epics'
export * as reducer from './reducer'

interface WSInput {
  store: Store<WSState>
  makeWSHandler?: MakeWSHandler
}

/**
  Premptively polls a data provider to keep data in the cache fresh
*/
export const withCacheWarmer =
  <D extends AdapterData>(
    warmerStore: Store<CacheWarmerState>,
    middleware: Middleware<AdapterRequest<D>>[],
    ws: WSInput,
  ) =>
  (rawExecute: Execute<AdapterRequest<D>>): Middleware<AdapterRequest<D>> =>
  async (execute, context) =>
  async (input) => {
    const isWarmerActive =
      util.parseBool(util.getEnv('CACHE_ENABLED', undefined, context)) &&
      util.parseBool(util.getEnv('WARMUP_ENABLED', undefined, context))
    if (!isWarmerActive) return await execute(input, context)

    const wsConfig = getWSConfig(input.data.endpoint, context)

    if (wsConfig.enabled && ws.makeWSHandler) {
      // If WS is available, and there is an active subscription, warmer should not be active
      let batchMemberHasActiveWSSubscription = false

      const keysToCheck = input.debug?.batchChildrenCacheKeys || [
        [input.debug?.cacheKey || '', input],
      ]

      for (const [key, childRequest] of keysToCheck) {
        // Could happen that a subscription is still loading. If that's the case, warmer will open a subscription. If the WS becomes active, on next requests warmer will be unsubscribed'      const wsHandler = await ws.makeWSHandler()
        const wsHandler = await ws.makeWSHandler()
        const subMessage = await wsHandler.subscribe(childRequest)
        const wsKey = subMessage && getSubsId(subMessage)
        const isActiveWSSubscription = wsKey && ws.store.getState().subscriptions.all[wsKey]?.active
        // If there is a WS subscription active, warmup subscription (if exists) should be removed, and not play for the moment
        const isActiveCWSubsciption = warmerStore.getState().subscriptions[key]
        if (isActiveWSSubscription) {
          if (isActiveCWSubsciption) {
            logger.info(`Active WS feed detected: disabling cache warmer for ${key}`)
            // If there is a Batch WS subscription active, warmup subscription should be removed
            if (isActiveCWSubsciption.parent && isActiveCWSubsciption.batchablePropertyPath)
              warmerStore.dispatch(
                actions.warmupLeaveGroup({
                  parent: isActiveCWSubsciption.parent,
                  childLastSeenById: { [key]: Date.now() },
                  batchablePropertyPath: isActiveCWSubsciption.batchablePropertyPath,
                }),
              )
            const isBatched = !!warmerStore.getState().subscriptions[key]?.childLastSeenById
            warmerStore.dispatch(
              actions.warmupUnsubscribed({
                key,
                isBatched,
                reason: 'Turning off Cache Warmer to use WS.',
              }),
            )
          }
          batchMemberHasActiveWSSubscription = true
        }
      }

      if (batchMemberHasActiveWSSubscription) {
        return await execute(input, context)
      }
    }

    // In case WS is not available, or WS has no active subscription, warmer should be active
    // Dispatch subscription only if execute was succesful
    const result = await execute(input, context)

    const warmupExecutePayload: actions.WarmupExecutePayload<D> = {
      ...input,
      executeFn: async (input) =>
        await (
          await withMiddleware(rawExecute, context, middleware)
        )(input, context),
      result,
    }
    const warmupExecuteAction = actions.makeWarmupExecute<D>()
    warmerStore.dispatch(warmupExecuteAction(warmupExecutePayload))

    return result
  }
