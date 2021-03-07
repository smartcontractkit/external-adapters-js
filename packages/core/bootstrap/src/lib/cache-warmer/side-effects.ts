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
  warmupFailed,
  warmupFulfilled,
  warmupRequested,
  warmupSubscribed,
  warmupSubscriptionTimeoutReset,
  warmupUnsubscribed,
} from './actions'
import { WARMUP_REQUEST_ID } from './config'
import { RootState } from './reducer'
import { EpicDependencies } from './store'
import { getSubscriptionKey } from './util'

export const warmupSubscriber: Epic<AnyAction, AnyAction, RootState, EpicDependencies> = (
  action$,
  state$,
  { config },
) =>
  action$.pipe(
    filter(warmupSubscribed.match),
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
        mapTo(warmupRequested({ key })),
        // unsubscribe our warmup algo when a matching unsubscribe comes in
        takeUntil(
          action$.pipe(
            filter(warmupUnsubscribed.match),
            filter((a) => a.payload.key === key),
          ),
        ),
      ),
    ),
  )

/**
 * Handle warmup response request events
 */
export const warmupRequestHandler: Epic<AnyAction, AnyAction, RootState> = (action$, state$) =>
  action$.pipe(
    // this pipeline will execute when we have a request to warm up an adapter
    filter(warmupRequested.match),
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
export const warmupUnsubscriber: Epic<AnyAction, AnyAction, RootState, EpicDependencies> = (
  action$,
  state$,
  { config },
) => {
  const unsubscribeOnFailure$ = action$.pipe(
    filter(warmupFailed.match),
    withLatestFrom(state$),
    filter(
      ([{ payload }, state]) => state.warmups[payload.key].errorCount >= config.unhealthyThreshold,
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

  return merge(unsubscribeOnFailure$, unsubscribeOnTimeout$)
}

export const rootEpic = combineEpics(warmupSubscriber, warmupUnsubscriber, warmupRequestHandler)
