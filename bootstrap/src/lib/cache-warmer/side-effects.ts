import { AnyAction } from 'redux'
import { combineEpics, Epic } from 'redux-observable'
import { from, interval, merge, of, race } from 'rxjs'
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
  warmupRequestFailed,
  warmupRequestFulfilled,
  warmupRequestRequested,
  warmupRequestSubscribed,
  warmupRequestSubscriptionTimeoutReset,
  warmupRequestUnsubscribed,
} from './actions'
import { RootState } from './reducer'
import { EpicDependencies } from './store'
import { getSubscriptionKey } from './util'

export const warmupSubscriber: Epic<AnyAction, AnyAction, RootState, EpicDependencies> = (
  action$,
  state$,
  { config },
) =>
  action$.pipe(
    filter(warmupRequestSubscribed.match),
    map(({ payload }) => ({ payload, key: getSubscriptionKey(payload) })),
    // check if the subscription already exists, then noop
    withLatestFrom(state$),
    filter(([{ key }, state]) => {
      // if subscription does not exist, then continue
      // this check doesnt work because state is already set!
      return !state.subscriptions[key].isDuplicate
    }),
    // on a subscribe action being dispatched, spin up a long lived interval if one doesnt exist yet
    mergeMap(([{ key }]) =>
      interval(config.warmupInterval).pipe(
        mapTo(warmupRequestRequested({ key })),
        // unsubscribe our warmup algo when a matching unsubscribe comes in
        takeUntil(
          action$.pipe(
            filter(warmupRequestUnsubscribed.match),
            filter((a) => a.payload.key === key),
          ),
        ),
      ),
    ),
  )
/**
 * Handle warmup response request events
 */
export const warmupRequestEpic: Epic<AnyAction, AnyAction, RootState> = (action$, state$) =>
  action$.pipe(
    // this pipeline will execute when we have a request to warm up an adapter
    filter(warmupRequestRequested.match),
    // fetch our required state to make a request to warm up an adapter
    withLatestFrom(state$),
    map(([action, state]) => ({
      requestData: state.subscriptions[action.payload.key],
      key: action.payload.key,
    })),
    // make the request
    mergeMap(({ requestData, key }) =>
      from(
        requestData.executeFn({
          id: '9001',
          data: { ...(requestData.info.data.data as any) }, // TODO: this data attribute should not be nested
          meta: { ...(requestData.info.meta ?? {}) },
        }),
      ).pipe(
        mapTo(warmupRequestFulfilled({ key })),
        catchError((error: unknown) => of(warmupRequestFailed({ error: error as Error, key }))),
      ),
    ),
  )

// we can combine this into one of the above epics if we have performance issues later on
export const warmupUnsubscriber: Epic<AnyAction, AnyAction, RootState, EpicDependencies> = (
  action$,
  state$,
  { config },
) => {
  const unsubscribeWhenFailureThresholdIsMet$ = action$.pipe(
    filter(warmupRequestFailed.match),
    withLatestFrom(state$),
    filter(
      ([{ payload }, state]) => state.response[payload.key].errorCount >= config.unhealthyThreshold,
    ),
    map(([{ payload }]) => warmupRequestUnsubscribed({ key: payload.key })),
  )

  // emits whenever a subscription event comes in,
  // used as a helper stream for the timeout limit stream
  const keyedSubscription$ = action$.pipe(
    filter(warmupRequestSubscribed.match),
    map(({ payload }) => ({ payload, key: getSubscriptionKey(payload) })),
  )

  const unsubscribeWhenTimeoutLimitIsMet$ = keyedSubscription$.pipe(
    // when a subscription comes in
    mergeMap(({ key }) => {
      // we look for matching subscriptions of the same type
      // which deactivates the current timer
      const reset$ = keyedSubscription$.pipe(
        filter(({ key: keyB }) => key === keyB),
        take(1),
        mapTo(warmupRequestSubscriptionTimeoutReset({ key })),
      )

      // start the current unsubscription timer
      const timeout$ = of(warmupRequestUnsubscribed({ key })).pipe(delay(config.subscriptionTTL))

      // if a re-subscription comes in before timeout emits, then we emit nothing
      // else we unsubscribe from the current subscription
      return race(reset$, timeout$)
    }),
  )

  return merge(unsubscribeWhenFailureThresholdIsMet$, unsubscribeWhenTimeoutLimitIsMet$)
}

export const rootEpic = combineEpics(warmupSubscriber, warmupUnsubscriber, warmupRequestEpic)
