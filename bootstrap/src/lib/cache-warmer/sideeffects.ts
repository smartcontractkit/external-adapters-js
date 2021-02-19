import { combineEpics, Epic } from 'redux-observable'
import { interval, of } from 'rxjs'
import {
  catchError,
  filter,
  map,
  mapTo,
  mergeMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators'
import {
  warmupRequestFailed,
  warmupRequestFulfilled,
  warmupRequestRequested,
  warmupRequestSubscribed,
  warmupRequestUnsubscribed,
} from './actions'
import * as config from './config'
import { RootState } from './reducer'
import { getSubscriptionKey } from './util'
const conf = config.get()

export const warmupSubscriber: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(warmupRequestSubscribed.match),
    map(({ payload }) => ({ payload, key: getSubscriptionKey(payload) })),
    // check if the subscription already exists, then noop
    withLatestFrom(state$),
    filter(([{ key }, state]) => !!state.subscriptions[key]),
    // on a subscribe action being dispatched, spin up a long lived interval if one doesnt exist yet
    mergeMap(([{ key }]) =>
      interval(conf.warmupInterval).pipe(
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
export const warmupRequestEpic: Epic<any, any, RootState> = (action$, state$) =>
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
    tap((data) => console.log(`Performing cache warmup on: ${JSON.stringify(data, null, 1)}`)),
    mergeMap(({ requestData, key }) =>
      of(requestData.executeFn(requestData.info)).pipe(
        mapTo(key),
        catchError(throwKeyedError(key)),
      ),
    ),
    map((key) => warmupRequestFulfilled({ key })),
    catchError((err: KeyedError) => of(warmupRequestFailed(err))),
  )

// we can combine this into one of the above epics if we have performance issues later on
export const warmupUnsubscriber: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(warmupRequestFailed.match),
    withLatestFrom(state$),
    filter(
      ([{ payload }, state]) => state.response[payload.key].errorCount >= conf.unhealthyThreshold,
    ),
    map(([{ payload }]) => warmupRequestUnsubscribed({ key: payload.key })),
  )

export const rootEpic = combineEpics(warmupSubscriber, warmupUnsubscriber, warmupRequestEpic)

/**
 * An object that wraps an object with a discriminator
 */
interface KeyedError {
  /**
   * Key that allows differentiation between other errors
   */
  key: string
  /**
   * Original error
   */
  error: Error
}

/**
 * A HOF that wraps errors in an object that has a discriminator.
 * TODO: We should probably extend the error object and create our own `KeyedError` type
 *
 * @param key The key to use for information retreival
 */
function throwKeyedError(key: string) {
  return (error: Error) => {
    const err: KeyedError = { key, error }
    throw err
  }
}
