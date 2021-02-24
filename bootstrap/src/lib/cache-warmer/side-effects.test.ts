import { AdapterRequest } from '@chainlink/types'
import { DeepPartial } from 'redux'
import { ActionsObservable, StateObservable } from 'redux-observable'
import { of, Subject, throwError } from 'rxjs'
import { RunHelpers } from 'rxjs/internal/testing/TestScheduler'
import { TestScheduler } from 'rxjs/testing'
import * as actions from './actions'
import { get } from './config'
import { RootState, SubscriptionState } from './reducer'
import { warmupRequestEpic, warmupSubscriber, warmupUnsubscriber } from './side-effects'
import { EpicDependencies } from './store'
let scheduler: TestScheduler

beforeEach(() => {
  scheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
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

describe('side effect tests', () => {
  const key1 = '80dd5e40ca3343c4ec07f4b572a5f8d30d0e2087'

  beforeEach(() => {
    epicDependencies = { config: get() }
  })

  describe('warmupSubscriber', () => {
    it('should create a warmup subscription and emit a request every 10 seconds, then unsubscribe one of the subscriptions', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
        const adapterRequest2: AdapterRequest = { data: { foo: 'bar' }, id: '0' }
        const action$ = actionStream(hot, 'a c 20s b ', {
          a: actions.warmupRequestSubscribed({ executeFn: jest.fn(), ...adapterRequest1 }),
          b: actions.warmupRequestUnsubscribed({
            key: key1,
          }),
          c: actions.warmupRequestSubscribed({ executeFn: jest.fn(), ...adapterRequest2 }),
        })
        const state$ = stateStream({
          subscriptions: {
            [key1]: { isDuplicate: false },
            '00b7f2cf13ae0eb34821a53f2e7801356cba188a': { isDuplicate: false },
          },
        })

        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 40s !').toBe('10s a b 9998ms a b 9999ms b', {
          a: actions.warmupRequestRequested({
            key: key1,
          }),
          b: actions.warmupRequestRequested({
            key: '00b7f2cf13ae0eb34821a53f2e7801356cba188a',
          }),
        })
      })
    })
    it('should skip creating a subscription if one already exists in state', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
        const action$ = actionStream(hot, 'a ', {
          a: actions.warmupRequestSubscribed({ executeFn: jest.fn(), ...adapterRequest1 }),
        })
        const state$ = stateStream({ subscriptions: { [key1]: { isDuplicate: true } } })
        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 40s !').toBe('', {})
      })
    })
  })
  describe('warmupRequest', () => {
    it('should handle warmup requests by executing a function to update the cache', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequestRequested({ key: key1 }),
        })
        const subscriptionState: SubscriptionState[string] = {
          executeFn: jest.fn().mockReturnValue(of('external adapter return value')),
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
        const subscriptionState: SubscriptionState[string] = {
          executeFn: jest.fn().mockReturnValue(throwError(Error('We havin a bad time'))),
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
            error: Error('We havin a bad time'),
          }),
        })
      })
    })
  })
  describe('warmupUnsubscriber', () => {
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
