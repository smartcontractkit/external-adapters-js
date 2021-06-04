import { AdapterRequest } from '@chainlink/types'
import { AnyAction } from 'redux'
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable'
import { from, merge, of, race, timer, partition } from 'rxjs'
import {
  catchError,
  delay,
  filter,
  map,
  mapTo,
  mergeMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'
import {
  warmupExecute,
  warmupFailed,
  warmupFulfilled,
  warmupJoinGroup,
  warmupRequested,
  warmupStopped,
  warmupSubscribed,
  warmupSubscriptionTimeoutReset,
  warmupUnsubscribed,
} from './actions'
import { Config, get, WARMUP_REQUEST_ID } from './config'
import { getSubscriptionKey } from './util'
import { SubscriptionData } from './reducer'
import { omit } from 'lodash'
import { actions } from '.'
// export * as actions from './actions'

export interface EpicDependencies {
  config: Config
}

export const executeHandler: Epic<AnyAction, AnyAction, any, EpicDependencies> = (
  action$,
  state$,
) => {
  const warmupExecute$ = action$.pipe(filter(warmupExecute.match), withLatestFrom(state$))

  const [batchExecute$, execute$] = partition(
    warmupExecute$,
    ([val]) => !!val.payload.result?.debug?.batchable,
  )

  const subscribeBatch$ = batchExecute$.pipe(
    map(([{ payload }, state]) => {
      const warmupSubscribedPayload: actions.WarmupSubscribedPayload = payload

      // Check if a batch warmer already exists
      const batchWarmer = (Object.entries<SubscriptionData>(state.cacheWarmer.subscriptions).find(
        ([_, subscriptionState]) =>
          subscriptionState.children && subscriptionState.executeFn === payload.executeFn,
      ) || [null, null])[0]

      // If no batch warmer exists, generate a new key by omitting the data property
      const parentKey = batchWarmer || getSubscriptionKey(omit(payload, ['data']))

      const children: { [childKey: string]: number } = {}
      // If result was from a batch request, start placeholder subscriptions for split individual requests
      if (payload.result?.data?.results) {
        for (const batchParticipant of Object.values<[AdapterRequest, number]>(
          payload.result.data.results,
        )) {
          const [request] = batchParticipant
          const warmupSubscribedPayloadChild = {
            ...payload,
            data: omit(request, ['debug', 'rateLimitMaxAge']),
            parent: parentKey,
          }
          const childKey = getSubscriptionKey(warmupSubscribedPayloadChild)
          children[childKey] = Date.now()
          warmupSubscribed(warmupSubscribedPayloadChild)
        }
        warmupSubscribedPayload.children = children
      }

      // If batch warmer already exists join it by combining in children
      if (batchWarmer) {
        // Turn an individual request into a child by starting a placeholder subscription
        if (payload.result?.data?.result) {
          warmupSubscribedPayload.parent = parentKey
          const childKey = getSubscriptionKey(warmupSubscribedPayload)
          children[childKey] = Date.now()
          warmupSubscribed(warmupSubscribedPayload)
        }

        return warmupJoinGroup({
          parent: parentKey,
          children: children,
          batchable: payload.result.debug.batchable,
        })
      }
      // If batch warmer does not exist, start it by using parentKey
      else {
        // Turn an individual request into a batch warmer
        if (payload.debug?.batchable && !Array.isArray(payload.data[payload.debug?.batchable])) {
          warmupSubscribedPayload.data[payload.debug?.batchable] = [
            warmupSubscribedPayload.data[payload.debug?.batchable],
          ]
        }
        warmupSubscribedPayload.key = parentKey
        return warmupSubscribed(warmupSubscribedPayload)
      }
    }),
  )

  const subscribeIndividual$ = execute$.pipe(mapTo(warmupSubscribed))

  return merge(subscribeBatch$, subscribeIndividual$)
}

export const warmupSubscriber: Epic<AnyAction, AnyAction, any, EpicDependencies> = (
  action$,
  state$,
  { config },
) =>
  action$.pipe(
    filter(warmupSubscribed.match),
    map(({ payload }) => ({
      payload,
      key: getSubscriptionKey(payload),
    })),
    withLatestFrom(state$),
    // check if the subscription already exists, then noop
    filter(([{ payload, key }, state]) => {
      // if a child, register, but don't warm
      if (payload.parent) return false
      // if subscription does not exist, then continue
      // this check doesnt work because state is already set!
      return !state.cacheWarmer.subscriptions[key]?.isDuplicate
    }),
    // on a subscribe action being dispatched, spin up a long lived interval if one doesnt exist yet
    mergeMap(([{ key }]) =>
      timer(0, config.warmupInterval).pipe(
        mapTo(warmupRequested({ key })),
        // unsubscribe our warmup algo when a matching unsubscribe comes in
        takeUntil(
          action$.pipe(
            filter(warmupUnsubscribed.match || warmupStopped.match),
            filter((a) => a.payload.key === key),
          ),
        ),
      ),
    ),
  )

/**
 * Handle warmup response request events
 */
export const warmupRequestHandler: Epic<AnyAction, AnyAction, any> = (action$, state$) =>
  action$.pipe(
    // this pipeline will execute when we have a request to warm up an adapter
    filter(warmupRequested.match),
    // fetch our required state to make a request to warm up an adapter
    withLatestFrom(state$),
    map(([action, state]) => ({
      requestData: state.cacheWarmer.subscriptions[action.payload.key],
      key: action.payload.key,
    })),
    // make the request
    mergeMap(({ requestData, key }) =>
      from(
        requestData.executeFn({
          id: WARMUP_REQUEST_ID,
          data: { ...(requestData.origin.data.data as any) }, // TODO: this data attribute should not be nested
          // don't pass a stale `meta` to force data refresh
        }),
      ).pipe(
        mapTo(warmupFulfilled({ key })),
        catchError((error: unknown) => of(warmupFailed({ error: error as Error, key }))),
      ),
    ),
  )

// we can combine this into one of the above epics if we have performance issues later on
export const warmupUnsubscriber: Epic<AnyAction, AnyAction, any, EpicDependencies> = (
  action$,
  state$,
  { config },
) => {
  const unsubscribeOnFailure$ = action$.pipe(
    filter(warmupFailed.match),
    withLatestFrom(state$),
    filter(
      ([{ payload }, state]) =>
        state.cacheWarmer.warmups[payload.key]?.errorCount ?? 0 >= config.unhealthyThreshold,
    ),
    map(([{ payload }]) => warmupUnsubscribed({ key: payload.key })),
  )

  // emits whenever a subscription event comes in,
  // used as a helper stream for the timeout limit stream
  const keyedSubscription$ = action$.pipe(
    filter(warmupSubscribed.match),
    map(({ payload }) => ({ payload, key: getSubscriptionKey(payload) })),
  )

  const unsubscribeOnTimeout$ = keyedSubscription$.pipe(
    // when a subscription comes in
    mergeMap(({ key }) => {
      // we look for matching subscriptions of the same type
      // which deactivates the current timer
      const reset$ = keyedSubscription$.pipe(
        filter(({ key: keyB }) => key === keyB),
        take(1),
        mapTo(warmupSubscriptionTimeoutReset({ key })),
      )

      // start the current unsubscription timer
      const timeout$ = of(warmupUnsubscribed({ key })).pipe(delay(config.subscriptionTTL))

      // if a re-subscription comes in before timeout emits, then we emit nothing
      // else we unsubscribe from the current subscription
      return race(reset$, timeout$)
    }),
  )

  const stopOnBatch$ = keyedSubscription$.pipe(
    // when a subscription comes in, if it has children
    filter(({ payload }) => !!payload?.children),
    mergeMap(({ payload }) =>
      Object.keys(payload?.children || {}).map((child) => warmupStopped({ key: child })),
    ),
  )

  return merge(unsubscribeOnFailure$, unsubscribeOnTimeout$, stopOnBatch$)
}

export const rootEpic = combineEpics(
  executeHandler,
  warmupSubscriber,
  warmupUnsubscriber,
  warmupRequestHandler,
)

export const epicMiddleware = createEpicMiddleware<any, any, any, EpicDependencies>({
  dependencies: { config: get() },
})
