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
  const adapterResult: AdapterResponse = {
    jobRunID: '1',
    statusCode: 200,
    data: {},
    result: 1,
  }
  const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
  const adapterRequest2: AdapterRequest = { data: { foo: 'bar' }, id: '0' }
  const key1 = '6fd5ecf807136e36fbc5392ff2d04b29539b3be4'
  const key2 = '8fccec6bd6b10e62b982fa3a1f91ec0dfe971b1a'
  beforeEach(() => {
    epicDependencies = { config: get() }
  })

  const batchKeyParent = 'a227f4e12a0b5b5558b871a53c92dbc9255a390b'
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
    debug: { batchablePropertyPath: ['key1'] },
  }
  const batchKeyChild1 = '500fb5c94385c85a5998d5870b463cf5041d4403'

  const batchableAdapterRequest2: AdapterRequest = { id: '0', data: { key1: ['baz'], key2: 'bar' } }
  const childAdapterRequest2: AdapterRequest = {
    id: '0',
    data: { key1: 'baz', key2: 'bar' },
  }
  const batchableAdapterResponse2: AdapterResponse = {
    jobRunID: '2',
    statusCode: 200,
    data: {
      results: [[{ key1: 'baz', key2: 'bar' }, 2]],
    },
    result: 2,
    debug: { batchablePropertyPath: ['key1'] },
  }
  const batchKeyChild2 = 'e4d4ae76e0deb22ff3a4802acfe4f081ca54825d'

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
              parent: batchKeyParent,
              result: batchableAdapterResponse1,
              batchablePropertyPath: batchableAdapterResponse1.debug.batchablePropertyPath,
            }),
            b: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchedAdapterRequest1,
              childLastSeenById: { [batchKeyChild1]: mockTime },
              key: batchKeyParent,
              result: batchableAdapterResponse1,
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
              parent: batchKeyParent,
              result: batchableAdapterResponse2,
              batchablePropertyPath: batchableAdapterResponse2.debug.batchablePropertyPath,
            }),
            b: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest2,
              childLastSeenById: { [batchKeyChild2]: mockTime },
              key: batchKeyParent,
              result: batchableAdapterResponse2,
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
                [batchKeyParent]: {
                  childLastSeenById: {},
                  executeFn: executeStub,
                  origin: batchedAdapterRequest1.data,
                },
              },
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest1,
              parent: batchKeyParent,
              result: batchableAdapterResponse1,
              batchablePropertyPath: batchableAdapterResponse1.debug.batchablePropertyPath,
            }),
            b: actions.warmupJoinGroup({
              batchablePropertyPath: batchableAdapterResponse1.debug.batchablePropertyPath,
              childLastSeenById: { [batchKeyChild1]: mockTime },
              parent: batchKeyParent,
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
                [batchKeyParent]: {
                  childLastSeenById: {},
                  executeFn: executeStub,
                  origin: batchedAdapterRequest1.data,
                },
              },
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...childAdapterRequest2,
              parent: batchKeyParent,
              result: batchableAdapterResponse2,
              batchablePropertyPath: batchableAdapterResponse2.debug.batchablePropertyPath,
            }),
            b: actions.warmupJoinGroup({
              batchablePropertyPath: batchableAdapterResponse1.debug.batchablePropertyPath,
              childLastSeenById: { [batchKeyChild2]: mockTime },
              parent: batchKeyParent,
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
            [batchKeyParent]: {
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
              parent: batchKeyParent,
            },
            [batchKeyChild2]: {
              origin: childAdapterRequest2.data,
              executeFn: executeStub,
              startedAt: mockTime,
              isDuplicate: false,
              parent: batchKeyParent,
            },
          },
          actions.warmupJoinGroup({
            batchablePropertyPath: batchableAdapterResponse1.debug.batchablePropertyPath,
            childLastSeenById: { [batchKeyChild2]: mockTime },
            parent: batchKeyParent,
          }),
        ),
      ).toEqual({
        [batchKeyParent]: {
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
          parent: batchKeyParent,
        },
        [batchKeyChild2]: {
          origin: childAdapterRequest2.data,
          executeFn: executeStub,
          startedAt: mockTime,
          isDuplicate: false,
          parent: batchKeyParent,
        },
      })
    })
    it('should handle warmupUnsubscribed action unsubscribing children', () => {
      const executeStub = stub()
      expect(
        subscriptionsReducer(
          {
            [batchKeyParent]: {
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
              parent: batchKeyParent,
            },
          },
          actions.warmupUnsubscribed({
            key: batchKeyParent,
          }),
        ),
      ).toEqual({})
    })
  })

  describe('warmupSubscriber', () => {
    it('should create a warmup subscription and emit a request every 30 seconds, then unsubscribe one of the subscriptions', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a c 40s b ', {
          a: actions.warmupSubscribed({
            executeFn: stub(),
            ...adapterRequest1,
            result: adapterResult,
          }),
          b: actions.warmupUnsubscribed({
            key: key1,
          }),
          c: actions.warmupSubscribed({
            executeFn: stub(),
            ...adapterRequest2,
            result: adapterResult,
          }),
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
        expectObservable(output$, '^ 35s !').toBe('a b 29998ms a b', {
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
          a: actions.warmupSubscribed({
            executeFn: stub(),
            ...adapterRequest1,
            result: adapterResult,
          }),
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
          a: actions.warmupSubscribed({
            executeFn: stub(),
            ...adapterRequest1,
            result: adapterResult,
          }),
          b: actions.warmupSubscribed({
            executeFn: stub(),
            ...adapterRequest2,
            result: adapterResult,
          }),
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
