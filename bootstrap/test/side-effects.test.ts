import { AdapterRequest } from '@chainlink/types'
import { expect } from 'chai'
import { DeepPartial } from 'redux'
import { ActionsObservable, StateObservable } from 'redux-observable'
import { of, Subject, throwError } from 'rxjs'
import { RunHelpers } from 'rxjs/internal/testing/TestScheduler'
import { TestScheduler } from 'rxjs/testing'
import { stub } from 'sinon'
import * as actions from '../src/lib/cache-warmer/actions'
import { get } from '../src/lib/cache-warmer/config'
import { RootState, SubscriptionState } from '../src/lib/cache-warmer/reducer'
import {
  warmupRequestHandler,
  warmupSubscriber,
  warmupUnsubscriber,
} from '../src/lib/cache-warmer/side-effects'
import { EpicDependencies } from '../src/lib/cache-warmer/store'

let scheduler: TestScheduler

beforeEach(() => {
  scheduler = new TestScheduler((actual, expected) => {
    expect(actual).to.deep.equal(expected)
  })
})

function stateStream(initialState: DeepPartial<RootState>): StateObservable<RootState> {
  return new StateObservable<RootState>(new Subject(), initialState as any)
}

function actionStream(
  hot: RunHelpers['hot'],
  expectedMarbles: string,
  marbleValues: Record<string, any>,
): ActionsObservable<any> {
  const action$ = hot(expectedMarbles, marbleValues) as any

  return action$
}

let epicDependencies: EpicDependencies
context('side effect tests', () => {
  const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
  const adapterRequest2: AdapterRequest = { data: { foo: 'bar' }, id: '0' }
  const key1 = 'be74e241ba991cd7ad65b1cbd04e4012459fb329'
  const key2 = '0797e1cb455bafc9295cc0e8a9b582e96272b8c6'
  beforeEach(() => {
    epicDependencies = { config: get() }
  })

  context('warmupSubscriber', () => {
    it('should create a warmup subscription and emit a request every 15 seconds, then unsubscribe one of the subscriptions', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a c 40s b ', {
          a: actions.warmupSubscribed({ executeFn: stub(), ...adapterRequest1 }),
          b: actions.warmupUnsubscribed({
            key: key1,
          }),
          c: actions.warmupSubscribed({ executeFn: stub(), ...adapterRequest2 }),
        })
        const state$ = stateStream({
          subscriptions: {
            [key1]: { isDuplicate: false },
            [key2]: { isDuplicate: false },
          },
        })

        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 50s !').toBe('15s a b 14998ms a b 14999ms b', {
          a: actions.warmupRequested({
            key: key1,
          }),
          b: actions.warmupRequested({
            key: key2,
          }),
        })
      })
    })

    it('should skip creating a subscription if one already exists in state', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a ', {
          a: actions.warmupSubscribed({ executeFn: stub(), ...adapterRequest1 }),
        })
        const state$ = stateStream({ subscriptions: { [key1]: { isDuplicate: true } } })
        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 40s !').toBe('', {})
      })
    })
  })

  context('warmup', () => {
    it('should handle warmup requests by executing a function to update the cache', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequested({ key: key1 }),
        })
        const subscriptionState: SubscriptionState[string] = {
          executeFn: stub().returns(of('external adapter return value')),
          origin: adapterRequest2,
          startedAt: Date.now(),
          isDuplicate: false,
        }
        const state$ = stateStream({
          subscriptions: { [key1]: subscriptionState },
        })

        const output$ = warmupRequestHandler(action$, state$, null)
        expectObservable(output$).toBe('a', {
          a: actions.warmupFulfilled({ key: key1 }),
        })
      })
    })
    it('should handle errors by emitting an error action', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequested({ key: key1 }),
        })
        const err = Error('We havin a bad time')
        const subscriptionState: SubscriptionState[string] = {
          executeFn: stub().returns(throwError(err)),
          origin: adapterRequest2,
          startedAt: Date.now(),
          isDuplicate: false,
        }
        const state$ = stateStream({
          subscriptions: { [key1]: subscriptionState },
        })

        const output$ = warmupRequestHandler(action$, state$, null)
        expectObservable(output$).toBe('a', {
          a: actions.warmupFailed({
            key: key1,
            error: err,
          }),
        })
      })
    })
  })
  context('warmupUnsubscriber', () => {
    it('should match on request failures and emit nothing while under the error threshold', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupFailed({
            key: key1,
            error: Error('We havin a bad time'),
          }),
        })
        const state$ = stateStream({
          warmups: {
            [key1]: {
              error: null,
              errorCount: 0,
              successCount: 0,
            },
          },
        })
        const output$ = warmupUnsubscriber(action$, state$, epicDependencies)
        expectObservable(output$).toBe('', {})
      })
    })
    it('should match on request failures and emit an unsubscription failure if the error threshold is met', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupFailed({
            key: key1,
            error: Error('We havin a bad time'),
          }),
        })
        const state$ = stateStream({
          warmups: {
            [key1]: {
              error: null,
              errorCount: 3,
              successCount: 0,
            },
          },
        })
        const output$ = warmupUnsubscriber(action$, state$, epicDependencies)
        expectObservable(output$).toBe('a', {
          a: actions.warmupUnsubscribed({ key: key1 }),
        })
      })
    })
    it('should start a subscription timeout timer that resets on every resubscription for the same key', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a b 50m a 50m a', {
          a: actions.warmupSubscribed({ executeFn: stub(), ...adapterRequest1 }),
          b: actions.warmupSubscribed({ executeFn: stub(), ...adapterRequest2 }),
        })
        const state$ = stateStream({})
        const output$ = warmupUnsubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 120m !').toBe('50m -- a 9m 59s 998ms b 40m - a', {
          a: actions.warmupSubscriptionTimeoutReset({ key: key1 }),
          b: actions.warmupUnsubscribed({ key: key2 }),
        })
      })
    })
  })
})
