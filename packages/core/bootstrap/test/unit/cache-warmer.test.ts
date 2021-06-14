import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { DeepPartial } from 'redux'
import { ActionsObservable, StateObservable } from 'redux-observable'
import { of, Subject, throwError } from 'rxjs'
import { RunHelpers } from 'rxjs/internal/testing/TestScheduler'
import { TestScheduler } from 'rxjs/testing'
import { stub } from 'sinon'
import * as actions from '../../src/lib/cache-warmer/actions'
import { get } from '../../src/lib/cache-warmer/config'
import {
  EpicDependencies,
  executeHandler,
  warmupRequestHandler,
  warmupSubscriber,
  warmupUnsubscriber,
} from '../../src/lib/cache-warmer/epics'
import { subscriptionsReducer } from '../../src/lib/cache-warmer/reducer'
import { RootState, SubscriptionState } from '../../src/lib/cache-warmer/reducer'

let scheduler: TestScheduler

beforeEach(() => {
  scheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })
})

function stateStream(initialState: {
  cacheWarmer: DeepPartial<RootState>
}): StateObservable<RootState> {
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
  const mockTime = 1487076708000
  const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
  const adapterRequest2: AdapterRequest = { data: { foo: 'bar' }, id: '0' }
  const key1 = '9f7f5d41cda1b19294354fe636cad6c40d9b0e41'
  const key2 = '553279571362b8072c206da5665629f22ac085c5'
  beforeEach(() => {
    epicDependencies = { config: get() }
  })

  const batchableAdapterRequest1: AdapterRequest = {
    id: '0',
    data: { key1: 'foo', key2: 'bar' },
  }
  const batchedAdapterRequest1: AdapterRequest = {
    id: '0',
    data: { key1: ['foo'], key2: 'bar' },
  }
  const batchableAdapterResponse1: AdapterResponse = {
    jobRunID: '1',
    statusCode: 200,
    data: {
      result: 1,
    },
    result: 1,
    debug: { batchKey: 'key1' },
  }
  const batchKeyParent1 = '485ed1ac6499b25e136fa3b001faf58dcdf277e0'
  const batchKeyChild1 = '9478057e793482736b315c1e2660350c4c6547ec'

  const batchableAdapterRequest2: AdapterRequest = { id: '0', data: { key1: ['baz'], key2: 'bar' } }
  const childAdapterRequest2: AdapterRequest = {
    id: '0',
    data: { key1: 'baz', key2: 'bar' },
  }
  const batchableAdapterResponse2: AdapterResponse = {
    jobRunID: '2',
    statusCode: 200,
    data: {
      results: { key1: [{ key1: 'baz', key2: 'bar' }, 2] },
    },
    result: 2,
    debug: { batchKey: 'key1' },
  }
  const batchKeyParent2 = '485ed1ac6499b25e136fa3b001faf58dcdf277e0'
  const batchKeyChild2 = '193785b17d2675cf42fea61df6110f85e79c742d'

  describe('executeHandler', () => {
    describe('when there are no subscriptions', () => {
      it('should start a batch warmer on the first non-batch request', () => {
        scheduler.run(({ hot, expectObservable }) => {
          Date.now = jest.fn(() => mockTime)
          const executeStub = stub()
          const action$ = actionStream(hot, 'a', {
            a: actions.warmupExecute({
              executeFn: executeStub,
              result: batchableAdapterResponse1,
              ...batchableAdapterRequest1,
            }),
          })
          const state$ = stateStream({
            cacheWarmer: {
              subscriptions: {},
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest1,
              parent: batchKeyParent1,
            }),
            b: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchedAdapterRequest1,
              childLastSeenById: { [batchKeyChild1]: mockTime },
              key: batchKeyParent1,
            }),
          })
        })
      })
      it('should turn the first batch request into a batch warmer', () => {
        scheduler.run(({ hot, expectObservable }) => {
          Date.now = jest.fn(() => mockTime)
          const executeStub = stub()
          const action$ = actionStream(hot, 'a', {
            a: actions.warmupExecute({
              executeFn: executeStub,
              result: batchableAdapterResponse2,
              ...batchableAdapterRequest2,
            }),
          })
          const state$ = stateStream({
            cacheWarmer: {
              subscriptions: {},
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...childAdapterRequest2,
              parent: batchKeyParent2,
            }),
            b: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest2,
              childLastSeenById: { [batchKeyChild2]: mockTime },
              key: batchKeyParent1,
            }),
          })
        })
      })
    })

    describe('when there is already a batch warmer subscription', () => {
      it('should join subsequent individual batchable request into the existing batch warmer subscription', () => {
        scheduler.run(({ hot, expectObservable }) => {
          const executeStub = stub()
          Date.now = jest.fn(() => mockTime)
          const action$ = actionStream(hot, 'a', {
            a: actions.warmupExecute({
              executeFn: executeStub,
              result: batchableAdapterResponse1,
              ...batchableAdapterRequest1,
            }),
          })
          const state$ = stateStream({
            cacheWarmer: {
              subscriptions: {
                [batchKeyParent1]: {
                  childLastSeenById: {},
                  executeFn: executeStub,
                },
              },
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest1,
              parent: batchKeyParent1,
            }),
            b: actions.warmupJoinGroup({
              batchKey: batchableAdapterResponse1.debug.batchKey,
              childLastSeenById: { [batchKeyChild1]: mockTime },
              parent: batchKeyParent1,
            }),
          })
        })
      })

      it('should join subsequent batch request into the existing batch warmer subscription', () => {
        scheduler.run(({ hot, expectObservable }) => {
          const executeStub = stub()
          Date.now = jest.fn(() => mockTime)
          const action$ = actionStream(hot, 'a', {
            a: actions.warmupExecute({
              executeFn: executeStub,
              result: batchableAdapterResponse2,
              ...batchableAdapterRequest2,
            }),
          })
          const state$ = stateStream({
            cacheWarmer: {
              subscriptions: {
                [batchKeyParent2]: {
                  childLastSeenById: {},
                  executeFn: executeStub,
                },
              },
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...childAdapterRequest2,
              parent: batchKeyParent2,
            }),
            b: actions.warmupJoinGroup({
              batchKey: batchableAdapterResponse1.debug.batchKey,
              childLastSeenById: { [batchKeyChild2]: mockTime },
              parent: batchKeyParent1,
            }),
          })
        })
      })
    })
  })

  describe('subscriptionsReducer', () => {
    it('should handle warmupJoinGroup actions', () => {
      const executeStub = stub()
      expect(
        subscriptionsReducer(
          {
            [batchKeyParent1]: {
              origin: batchedAdapterRequest1.data,
              executeFn: executeStub,
              startedAt: mockTime,
              isDuplicate: false,
              childLastSeenById: { [batchKeyChild1]: mockTime },
            },
            [batchKeyChild1]: {
              origin: batchableAdapterRequest1.data,
              executeFn: executeStub,
              startedAt: mockTime,
              isDuplicate: false,
              parent: batchKeyParent1,
            },
            [batchKeyChild2]: {
              origin: childAdapterRequest2.data,
              executeFn: executeStub,
              startedAt: mockTime,
              isDuplicate: false,
              parent: batchKeyParent1,
            },
          },
          actions.warmupJoinGroup({
            batchKey: batchableAdapterResponse1.debug.batchKey,
            childLastSeenById: { [batchKeyChild2]: mockTime },
            parent: batchKeyParent1,
          }),
        ),
      ).toEqual({
        [batchKeyParent1]: {
          origin: { key1: ['foo', 'baz'], key2: 'bar' },
          executeFn: executeStub,
          startedAt: mockTime,
          isDuplicate: false,
          childLastSeenById: { [batchKeyChild1]: mockTime, [batchKeyChild2]: mockTime },
        },
        [batchKeyChild1]: {
          origin: batchableAdapterRequest1.data,
          executeFn: executeStub,
          startedAt: mockTime,
          isDuplicate: false,
          parent: batchKeyParent1,
        },
        [batchKeyChild2]: {
          origin: childAdapterRequest2.data,
          executeFn: executeStub,
          startedAt: mockTime,
          isDuplicate: false,
          parent: batchKeyParent1,
        },
      })
    })
  })

  describe('warmupSubscriber', () => {
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
          cacheWarmer: {
            subscriptions: {
              [key1]: { isDuplicate: false },
              [key2]: { isDuplicate: false },
            },
          },
        })

        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 35s !').toBe('a b 14999ms a b 14999ms a b', {
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
        const state$ = stateStream({
          cacheWarmer: { subscriptions: { [key1]: { isDuplicate: true } } },
        })
        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 40s !').toBe('', {})
      })
    })
  })

  describe('warmup', () => {
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
          cacheWarmer: {
            subscriptions: { [key1]: subscriptionState },
          },
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
          cacheWarmer: {
            subscriptions: { [key1]: subscriptionState },
          },
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
  describe('warmupUnsubscriber', () => {
    it('should match on request failures and emit nothing while under the error threshold', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupFailed({
            key: key1,
            error: Error('We havin a bad time'),
          }),
        })
        const state$ = stateStream({
          cacheWarmer: {
            warmups: {
              [key1]: {
                error: null,
                errorCount: 0,
                successCount: 0,
              },
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
          cacheWarmer: {
            warmups: {
              [key1]: {
                error: null,
                errorCount: 3,
                successCount: 0,
              },
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
        const state$ = stateStream({ cacheWarmer: {} })
        const output$ = warmupUnsubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 120m !').toBe('50m -- a 9m 59s 998ms b 40m - a', {
          a: actions.warmupSubscriptionTimeoutReset({ key: key1 }),
          b: actions.warmupUnsubscribed({ key: key2 }),
        })
      })
    })
  })
})
