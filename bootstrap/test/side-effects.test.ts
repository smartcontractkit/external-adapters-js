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
  warmupRequestEpic,
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
  const key1 = 'be74e241ba991cd7ad65b1cbd04e4012459fb329'

  beforeEach(() => {
    epicDependencies = { config: get() }
  })

  context('warmupSubscriber', () => {
    it('should create a warmup subscription and emit a request every 15 seconds, then unsubscribe one of the subscriptions', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
        const adapterRequest2: AdapterRequest = { data: { foo: 'bar' }, id: '0' }
        const action$ = actionStream(hot, 'a c 40s b ', {
          a: actions.warmupRequestSubscribed({ executeFn: stub(), ...adapterRequest1 }),
          b: actions.warmupRequestUnsubscribed({
            key: key1,
          }),
          c: actions.warmupRequestSubscribed({ executeFn: stub(), ...adapterRequest2 }),
        })
        const state$ = stateStream({
          subscriptions: {
            [key1]: { isDuplicate: false },
            '0797e1cb455bafc9295cc0e8a9b582e96272b8c6': { isDuplicate: false },
          },
        })

        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 50s !').toBe('15s a b 14998ms a b 14999ms b', {
          a: actions.warmupRequestRequested({
            key: key1,
          }),
          b: actions.warmupRequestRequested({
            key: '0797e1cb455bafc9295cc0e8a9b582e96272b8c6',
          }),
        })
      })
    })

    it('should skip creating a subscription if one already exists in state', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
        const action$ = actionStream(hot, 'a ', {
          a: actions.warmupRequestSubscribed({ executeFn: stub(), ...adapterRequest1 }),
        })
        const state$ = stateStream({ subscriptions: { [key1]: { isDuplicate: true } } })
        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 40s !').toBe('', {})
      })
    })
  })

  context('warmupRequest', () => {
    it('should handle warmup requests by executing a function to update the cache', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequestRequested({ key: key1 }),
        })
        const subscriptionState: SubscriptionState[string] = {
          executeFn: stub().returns(of('external adapter return value')),
          info: { id: '0', data: { foo: 'bar' } },
          startedAt: Date.now(),
          isDuplicate: false,
        }
        const state$ = stateStream({
          subscriptions: { [key1]: subscriptionState },
        })

        const output$ = warmupRequestEpic(action$, state$, null)
        expectObservable(output$).toBe('a', {
          a: actions.warmupRequestFulfilled({ key: key1 }),
        })
      })
    })
    it('should handle errors by emitting an error action', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequestRequested({ key: key1 }),
        })
        const err = Error('We havin a bad time')
        const subscriptionState: SubscriptionState[string] = {
          executeFn: stub().returns(throwError(err)),
          info: { id: '0', data: { foo: 'bar' } },
          startedAt: Date.now(),
          isDuplicate: false,
        }
        const state$ = stateStream({
          subscriptions: { [key1]: subscriptionState },
        })

        const output$ = warmupRequestEpic(action$, state$, null)
        expectObservable(output$).toBe('a', {
          a: actions.warmupRequestFailed({
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
          a: actions.warmupRequestFailed({
            key: key1,
            error: Error('We havin a bad time'),
          }),
        })
        const state$ = stateStream({
          response: {
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
          a: actions.warmupRequestFailed({
            key: key1,
            error: Error('We havin a bad time'),
          }),
        })
        const state$ = stateStream({
          response: {
            [key1]: {
              error: null,
              errorCount: 3,
              successCount: 0,
            },
          },
        })
        const output$ = warmupUnsubscriber(action$, state$, epicDependencies)
        expectObservable(output$).toBe('a', {
          a: actions.warmupRequestUnsubscribed({ key: key1 }),
        })
      })
    })
  })
})
