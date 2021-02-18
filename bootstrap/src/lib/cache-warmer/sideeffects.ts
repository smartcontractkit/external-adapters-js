import { combineEpics, Epic } from 'redux-observable'
import { of, race } from 'rxjs'
import {
  catchError,
  delay,
  filter,
  map,
  mapTo,
  mergeMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators'
import {
  warmupRequestFailed,
  warmupRequestFulfilled,
  warmupRequestRecieved,
  warmupResponseFailed,
  warmupResponseFulfilled,
  warmupResponseRequested,
} from './actions'
import * as config from './config'
import { RootState } from './reducer'
import { getRequestKey } from './util'
const conf = config.get()

/**
 * This side effect handler handles cache warmups for external adapters
 *
 * This side effect handler recieves events in the form of requests that are sent in from adapters,
 * then tracks when each EA cache would get cold via configured TTL.
 *
 * If the cache is ever determined to turn cold, a warmup response is sent to that particular EA to
 * keep its cache warm, avoiding performance penalties of a cache bust.
 * This is done by calling the adapter's wrapped `execute` function, triggering it to create a request.
 */

/**
 * Handle warmup request received events
 */
export const warmupRequestEpic: Epic<any, any, RootState> = (action$, _state$) =>
  action$.pipe(
    filter(warmupRequestRecieved.match),
    mergeMap((action) => {
      const key = getRequestKey(action.payload)
      // if this emits, we refresh our timer for this particular request
      const dropWarmupResponse$ = action$.pipe(
        filter(warmupRequestRecieved.match),
        filter((a) => isSameEA(a, action)),
      )
      // if this emits, we will emit an event to send a warmup response to an EA
      const requestWarmupResponse$ = of(warmupResponseRequested({ key })).pipe(delay(conf.ttl))

      // race between a matching request already coming in to refresh timer on a request
      // vs a request timing out and needing a cache warmup
      return race(requestWarmupResponse$, dropWarmupResponse$).pipe(
        mapTo(warmupRequestFulfilled({ key })),
        catchError(throwKeyedError(key)),
      )
    }),
    catchError((err: KeyedError) => of(warmupRequestFailed(err))),
  )

/**
 * Handle warmup response request events
 */
export const warmupResponseEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    // this pipeline will execute when we have a request to warm up an adapter
    filter(warmupResponseRequested.match),
    // fetch our required state to make a request to warm up an adapter
    withLatestFrom(state$),
    map(([action, state]) => ({
      requestData: state.request[action.payload.key],
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
    map((key) => warmupResponseFulfilled({ key })),
    catchError((err: KeyedError) => of(warmupResponseFailed(err))),
  )

export const rootEpic = combineEpics(warmupRequestEpic, warmupResponseEpic)

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

/**
 * Perform equality comparison on two warmup request actions
 * @param a First action to perform comparison on
 * @param b Second action to perform comparsion on
 */
function isSameEA(
  a: ReturnType<typeof warmupRequestRecieved>,
  b: ReturnType<typeof warmupRequestRecieved>,
): boolean {
  return getRequestKey(a.payload) === getRequestKey(b.payload)
}
