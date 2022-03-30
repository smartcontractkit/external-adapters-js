import type {
  AdapterData,
  AdapterRequest,
  Execute,
  MakeWSHandler,
  Middleware,
} from '../../../types'
import type { Store } from 'redux'
import { withMiddleware } from '../../../index'
import { logger } from '../../modules'
import { getFeedId } from '../../metrics/util'
import * as util from '../../util'
import { getWSConfig } from '../ws/config'
import { getSubsId, RootState as WSState } from '../ws/reducer'
import { separateBatches } from '../ws/utils'
import * as actions from './actions'
import type { CacheWarmerState } from './reducer'
import { getSubscriptionKey } from './util'

export { WARMUP_REQUEST_ID } from './config'
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
      util.parseBool(util.getEnv('WARMUP_ENABLED'))
    if (!isWarmerActive) return await execute(input, context)

    const wsConfig = getWSConfig(input.data.endpoint, context)
    const warmupSubscribedPayload: actions.WarmupSubscribedPayload<D> = {
      ...input,
      // We need to initilialize the middleware on every beat to open a connection with the cache
      // Wrapping `rawExecute` as `execute` is already wrapped with the default middleware. Warmer doesn't need every default middleware
      executeFn: async (input) =>
        await (
          await withMiddleware<D>(rawExecute, context, middleware)
        )(input, context),
      // Dummy result
      result: {
        jobRunID: '1',
        statusCode: 200,
        data: {
          statusCode: 200,
        },
        result: 1,
      },
    }

    if (wsConfig.enabled && ws.makeWSHandler) {
      // If WS is available, and there is an active subscription, warmer should not be active
      const wsHandler = await ws.makeWSHandler()

      let batchMemberHasActiveWSSubscription = false
      await separateBatches(input, async (singleInput: AdapterRequest) => {
        const subscriptionMessage = wsHandler.subscribe(singleInput)
        const wsSubscriptionKey = subscriptionMessage ? getSubsId(subscriptionMessage) : null
        const cacheWarmerKey = getSubscriptionKey(warmupSubscribedPayload)

        // Could happen that a subscription is still loading. If that's the case, warmer will open a subscription. If the WS becomes active, on next requests warmer will be unsubscribed
        const isActiveWSSubscription = wsSubscriptionKey
          ? ws.store.getState().subscriptions.all[wsSubscriptionKey]?.active
          : false
        // If there is a WS subscription active, warmup subscription (if exists) should be removed, and not play for the moment
        const isActiveCWSubsciption = warmerStore.getState().subscriptions[cacheWarmerKey]
        if (isActiveWSSubscription) {
          if (isActiveCWSubsciption) {
            logger.info(
              `Active WS feed detected: disabling cache warmer for ${getFeedId(singleInput)}`,
            )
            // If there is a Batch WS subscription active, warmup subscription should be removed
            if (isActiveCWSubsciption.parent && isActiveCWSubsciption.batchablePropertyPath)
              warmerStore.dispatch(
                actions.warmupLeaveGroup({
                  parent: isActiveCWSubsciption.parent,
                  childLastSeenById: { [cacheWarmerKey]: Date.now() },
                  batchablePropertyPath: isActiveCWSubsciption.batchablePropertyPath,
                }),
              )
            const isBatched =
              !!warmerStore.getState().subscriptions[cacheWarmerKey]?.childLastSeenById
            warmerStore.dispatch(
              actions.warmupUnsubscribed({
                key: cacheWarmerKey,
                isBatched,
                reason: 'Turning off Cache Warmer to use WS.',
              }),
            )
          }
          batchMemberHasActiveWSSubscription = true
        }
      })
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
