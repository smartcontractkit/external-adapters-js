import {
  AdapterBatchResponse,
  AdapterData,
  AdapterDebug,
  AdapterRequest,
  AdapterResponse,
  APIEndpoint,
  BatchableProperty,
  Config,
  InputParameters,
} from '../../src/types'
import { ActionsObservable, StateObservable } from 'redux-observable'
import { Subject } from 'rxjs'
import { RunHelpers } from 'rxjs/internal/testing/TestScheduler'
import { TestScheduler } from 'rxjs/testing'
import { stub } from 'sinon'
import * as actions from '../../src/lib/middleware/cache-warmer/actions'
import { get } from '../../src/lib/middleware/cache-warmer/config'
import {
  EpicDependencies,
  executeHandler,
  warmupRequestHandler,
  warmupSubscriber,
  warmupUnsubscriber,
} from '../../src/lib/middleware/cache-warmer/epics'
import {
  CacheWarmerState,
  subscriptionsReducer,
} from '../../src/lib/middleware/cache-warmer/reducer'
import { SubscriptionState } from '../../src/lib/middleware/cache-warmer/reducer'
import { getCacheKey } from '../../src/lib/middleware/cache-key'
import { initialState } from '../../src'

let scheduler: TestScheduler

beforeEach(() => {
  scheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })
})

function stateStream(initialWarmerState: { cacheWarmer: CacheWarmerState }): StateObservable<any> {
  return new StateObservable<any>(new Subject(), {
    ...initialState,
    ...initialWarmerState,
  })
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

const mockTime = 1487076708000
const adapterResult: AdapterResponse = {
  jobRunID: '1',
  statusCode: 200,
  data: { statusCode: 200 },
  result: 1,
}
const adapterRequest1: AdapterRequest = { data: {}, id: '0' }
const adapterRequest2: AdapterRequest = { data: { foo: 'bar' }, id: '0' }
const key1 = '6fd5ecf807136e36fbc5392ff2d04b29539b3be4'
const key2 = '8fccec6bd6b10e62b982fa3a1f91ec0dfe971b1a'

describe('side effect tests', () => {
  beforeEach(() => {
    epicDependencies = { config: get() }
  })

  const apiEndpoint: APIEndpoint<Config> = {
    supportedEndpoints: ['test'],
    inputParameters: {
      key1: {
        type: 'string',
      },
      key2: {
        type: 'string',
      },
    },
    execute: undefined,
    batchablePropertyPath: [
      {
        name: 'key1',
      },
    ],
  }

  const batchKeyParent = 'a227f4e12a0b5b5558b871a53c92dbc9255a390b'
  const batchableAdapterRequest1: AdapterRequest = {
    id: '0',
    data: { key1: 'foo', key2: 'bar' },
  }
  const batchedAdapterRequest1: AdapterRequest = {
    id: '0',
    data: { key1: ['foo'], key2: 'bar' },
  }
  const batchedAdapterRequest2 = {
    id: '0',
    key1: ['foo', 'foo2', 'foo3', 'foo4'],
    key2: 'bar',
  }
  const batchableAdapterResponse1: AdapterResponse = {
    jobRunID: '1',
    statusCode: 200,
    data: {
      result: 1,
      statusCode: 200,
    },
    result: 1,
    debug: { batchablePropertyPath: [{ name: 'key1' }] },
  }
  const batchKeyChild1 = '500fb5c94385c85a5998d5870b463cf5041d4403'

  const batchableAdapterRequest2: AdapterRequest = {
    id: '0',
    data: { key1: ['baz'], key2: 'bar' },
  }
  const adapterRequestData2 = { key1: 'baz', key2: 'bar' }
  const childAdapterRequest2: AdapterRequest = {
    id: '0',
    data: adapterRequestData2,
  }
  const childAdapterKey2 = getCacheKey(
    batchableAdapterRequest2,
    Object.keys(apiEndpoint.inputParameters as InputParameters<AdapterData>),
  )
  const batchableAdapterResponse2: AdapterResponse = {
    jobRunID: '2',
    statusCode: 200,
    data: {
      statusCode: 200,
      results: [[childAdapterKey2, childAdapterRequest2, 2]],
    },
    result: 2,
    debug: { batchablePropertyPath: [{ name: 'key1' }] },
  }
  const batchKeyChild2 = '4XyyAD5vDCcrJZgc1kqwngWDKqM='

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
              warmups: {},
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest1,
              parent: batchKeyParent,
              result: batchableAdapterResponse1,
              batchablePropertyPath: (batchableAdapterResponse1.debug as AdapterDebug)
                .batchablePropertyPath,
            }),
            b: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchedAdapterRequest1,
              childLastSeenById: { [batchKeyChild1]: mockTime },
              key: batchKeyParent,
              result: batchableAdapterResponse1,
              batchablePropertyPath: (batchableAdapterResponse1.debug as AdapterDebug)
                .batchablePropertyPath,
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
              warmups: {},
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribedMultiple({
              members: [
                {
                  executeFn: executeStub,
                  key: childAdapterKey2,
                  ...childAdapterRequest2,
                  parent: batchKeyParent,
                  result: batchableAdapterResponse2,
                  batchablePropertyPath: (batchableAdapterResponse2.debug as AdapterDebug)
                    .batchablePropertyPath,
                },
              ],
            }),
            b: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest2,
              childLastSeenById: { [batchKeyChild2]: mockTime },
              key: batchKeyParent,
              result: batchableAdapterResponse2,
              batchablePropertyPath: (batchableAdapterResponse2.debug as AdapterDebug)
                .batchablePropertyPath,
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
                  startedAt: 1,
                  isDuplicate: false,
                  childLastSeenById: {},
                  executeFn: executeStub,
                  origin: batchedAdapterRequest1.data,
                },
              },
              warmups: {},
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribed({
              executeFn: executeStub,
              ...batchableAdapterRequest1,
              parent: batchKeyParent,
              result: batchableAdapterResponse1,
              batchablePropertyPath: (batchableAdapterResponse1.debug as AdapterDebug)
                .batchablePropertyPath,
            }),
            b: actions.warmupJoinGroup({
              batchablePropertyPath: (batchableAdapterResponse1.debug as AdapterDebug)
                .batchablePropertyPath as BatchableProperty[],
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
                  startedAt: 1,
                  isDuplicate: false,
                  childLastSeenById: {},
                  executeFn: executeStub,
                  origin: batchedAdapterRequest1.data,
                },
              },
              warmups: {},
            },
          })

          const output$ = executeHandler(action$, state$, epicDependencies)
          expectObservable(output$).toBe('(a b)', {
            a: actions.warmupSubscribedMultiple({
              members: [
                {
                  executeFn: executeStub,
                  ...childAdapterRequest2,
                  key: childAdapterKey2,
                  parent: batchKeyParent,
                  result: batchableAdapterResponse2,
                  batchablePropertyPath: (batchableAdapterResponse2.debug as AdapterDebug)
                    .batchablePropertyPath,
                },
              ],
            }),
            b: actions.warmupJoinGroup({
              batchablePropertyPath: (batchableAdapterResponse1.debug as AdapterDebug)
                .batchablePropertyPath as BatchableProperty[],
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
            batchablePropertyPath: (batchableAdapterResponse1.debug as AdapterDebug)
              .batchablePropertyPath as BatchableProperty[],
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
            reason: 'Unsubscribe test',
            isBatched: true,
          }),
        ),
      ).toEqual({})
    })
  })

  describe('warmupSubscriber', () => {
    it('should create a warmup subscription and emit a request every 29 seconds, then unsubscribe one of the subscriptions', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a c 40s b ', {
          a: actions.warmupSubscribed({
            executeFn: stub(),
            ...adapterRequest1,
            result: adapterResult,
          }),
          b: actions.warmupUnsubscribed({
            key: key1,
            reason: 'Unsubscribe test',
            isBatched: true,
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
              [key1]: {
                isDuplicate: false,
                startedAt: 1,
                origin: adapterRequest1.data,
                executeFn: async () => adapterResult,
              },
              [key2]: {
                isDuplicate: false,
                startedAt: 1,
                origin: adapterRequest2.data,
                executeFn: async () => adapterResult,
              },
            },
            warmups: {},
          },
        })

        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 35s !').toBe('29000ms a b', {
          a: actions.warmupRequested({
            key: key1,
          }),
          b: actions.warmupRequested({
            key: key2,
          }),
        })
      })
    })

    it('should create a warmup subscription  with configured interval', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a c 9s b ', {
          a: actions.warmupSubscribed({
            executeFn: stub(),
            ...adapterRequest1,
            result: adapterResult,
          }),
          b: actions.warmupUnsubscribed({
            key: key1,
            reason: 'Unsubscribe test',
            isBatched: true,
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
              [key1]: {
                isDuplicate: false,
                startedAt: 1,
                origin: adapterRequest1.data,
                executeFn: async () => adapterResult,
              },
              [key2]: {
                isDuplicate: false,
                startedAt: 1,
                origin: adapterRequest2.data,
                executeFn: async () => adapterResult,
              },
            },
            warmups: {},
          },
        })

        const config = { ...epicDependencies.config, warmupInterval: 8000 }
        const output$ = warmupSubscriber(action$, state$, { config })
        // With offset, we expect 7000ms when interval is set to 8000ms
        expectObservable(output$, '^ 14s !').toBe('7000ms a b', {
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
          cacheWarmer: {
            subscriptions: {
              [key1]: {
                isDuplicate: true,
                startedAt: 55,
                origin: adapterRequest1.data,
                executeFn: async () => adapterResult,
              },
            },
            warmups: {},
          },
        })
        const output$ = warmupSubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 40s !').toBe('', {})
      })
    })
  })

  describe('warmup', () => {
    it('should handle warmup requests by executing a function to update the cache', () => {
      scheduler.run(({ hot }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequested({ key: key1 }),
        })
        const subscriptionState: SubscriptionState[string] = {
          executeFn: async () => ({
            jobRunID: '1',
            statusCode: 200,
            result: 1,
            data: {
              statusCode: 200,
              result: 1,
            },
          }),
          origin: adapterRequest2.data,
          startedAt: Date.now(),
          isDuplicate: false,
          childLastSeenById: {
            [key2]: 2,
          },
          batchablePropertyPath: [{ name: 'foo' }],
        }
        const childState: SubscriptionState[string] = {
          executeFn: async () => ({
            jobRunID: '1',
            statusCode: 200,
            result: 1,
            data: {
              statusCode: 200,
              results: [{}, 1] as AdapterBatchResponse,
            },
          }),
          origin: adapterRequest2.data,
          startedAt: Date.now(),
          isDuplicate: false,
          batchablePropertyPath: [{ name: 'foo' }],
        }
        const state$ = stateStream({
          cacheWarmer: {
            subscriptions: { [key1]: subscriptionState, [key2]: childState },
            warmups: {},
          },
        })

        const output$ = warmupRequestHandler(action$, state$, null)
        output$.subscribe((action) =>
          expect(action).toEqual(actions.warmupFulfilled({ key: key1 })),
        )
      })
    })
    it('should handle errors by emitting an error action', () => {
      scheduler.run(({ hot }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequested({ key: key1 }),
        })
        const err = Error('We havin a bad time')
        const subscriptionState: SubscriptionState[string] = {
          executeFn: async () => {
            throw err
          },
          origin: adapterRequest2.data,
          startedAt: Date.now(),
          isDuplicate: false,
          batchablePropertyPath: [{ name: 'foo' }],
          childLastSeenById: {
            [key2]: 2,
          },
        }
        const childState: SubscriptionState[string] = {
          executeFn: async () => {
            throw err
          },
          origin: adapterRequest2.data,
          startedAt: Date.now(),
          isDuplicate: false,
          batchablePropertyPath: [{ name: 'foo' }],
        }
        const state$ = stateStream({
          cacheWarmer: {
            subscriptions: { [key1]: subscriptionState, [key2]: childState },
            warmups: {},
          },
        })

        const output$ = warmupRequestHandler(action$, state$, null)
        output$.subscribe((action) =>
          expect(action).toEqual(
            actions.warmupFailed({
              key: key1,
              error: err,
              feedLabel: '{"data":{"foo":"bar"}}',
            }),
          ),
        )
      })
    })
    it('should throw an error if the API has a limit and no limit is provided', () => {
      scheduler.run(({ hot }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequested({ key: key1 }),
        })
        const err = Error('Exceeded batch limit')
        const limit = batchedAdapterRequest2.key1.length
        const subscriptionState: SubscriptionState[string] = {
          executeFn: async (input: AdapterRequest) => {
            if ((input.data.key1 as string).length >= limit) throw err
            return {
              jobRunID: '1',
              statusCode: 200,
              result: 'external adapter return value',
              data: {
                statusCode: 200,
                results: [{}, 1] as AdapterBatchResponse,
              },
            }
          },
          origin: batchedAdapterRequest2,
          startedAt: Date.now(),
          isDuplicate: false,
          childLastSeenById: {
            [key2]: 2,
          },
          batchablePropertyPath: [{ name: 'key1' }],
        }
        const childState: SubscriptionState[string] = {
          executeFn: async () => {
            throw err
          },
          origin: adapterRequest2.data,
          startedAt: Date.now(),
          isDuplicate: false,
          batchablePropertyPath: [{ name: 'key1' }],
        }
        const state$ = stateStream({
          cacheWarmer: {
            subscriptions: { [key1]: subscriptionState, [key2]: childState },
            warmups: {},
          },
        })

        const output$ = warmupRequestHandler(action$, state$, null)
        output$.subscribe((action) =>
          expect(action).toEqual(
            actions.warmupFailed({
              key: key1,
              error: err,
              feedLabel: '{"data":{"id":"0","key1":["foo","foo2","foo3","foo4"],"key2":"bar"}}',
            }),
          ),
        )
      })
    })
    it('should succeed if doing batched requests when there is a limit', () => {
      scheduler.run(({ hot }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupRequested({ key: key1 }),
        })
        const err = Error('Exceeded batch limit')
        const limit = batchedAdapterRequest2.key1.length
        const subscriptionState: SubscriptionState[string] = {
          executeFn: async (input: AdapterRequest) => {
            if ((input.data.key1 as string).length >= limit) throw err
            return {
              jobRunID: '1',
              statusCode: 200,
              result: 'external adapter return value',
              data: {
                statusCode: 200,
                results: [{}, 1] as AdapterBatchResponse,
              },
            }
          },
          origin: batchedAdapterRequest2,
          startedAt: Date.now(),
          isDuplicate: false,
          childLastSeenById: {
            [key2]: 2,
          },
          batchablePropertyPath: [{ name: 'key1', limit: 2 }],
        }
        const childState: SubscriptionState[string] = {
          executeFn: async () => {
            throw err
          },
          origin: adapterRequest2.data,
          startedAt: Date.now(),
          isDuplicate: false,
          batchablePropertyPath: [{ name: 'key1', limit: 2 }],
        }
        const state$ = stateStream({
          cacheWarmer: {
            subscriptions: { [key1]: subscriptionState, [key2]: childState },
            warmups: {},
          },
        })

        const output$ = warmupRequestHandler(action$, state$, null)
        output$.subscribe((action) =>
          expect(action).toEqual(actions.warmupFulfilled({ key: key1 })),
        )
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
            feedLabel: '{"data":{"data":{"foo":"bar"},"id":"0"}}',
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
            subscriptions: {},
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
            key: key2,
            error: Error('We havin a bad time'),
            feedLabel: '{"data":{"data":{"foo":"bar"},"id":"0"}}',
          }),
        })
        const state$ = stateStream({
          cacheWarmer: {
            warmups: {
              [key2]: {
                error: null,
                errorCount: 3,
                successCount: 0,
              },
            },
            subscriptions: {
              [key2]: {
                executeFn: async () => ({} as AdapterResponse<AdapterData>),
                origin: adapterRequest2.data,
                startedAt: Date.now(),
                isDuplicate: false,
                batchablePropertyPath: [{ name: 'foo' }],
                childLastSeenById: {
                  [key2]: 2,
                },
              },
            },
          },
        })
        const output$ = warmupUnsubscriber(action$, state$, epicDependencies)
        expectObservable(output$).toBe('a', {
          a: actions.warmupUnsubscribed({
            key: key2,
            isBatched: true,
            reason: 'Errored: We havin a bad time',
          }),
        })
      })
    })
    it('should match on request failures and not emit nothing if error threshold is -1', () => {
      scheduler.run(({ hot, expectObservable }) => {
        const action$ = actionStream(hot, 'a', {
          a: actions.warmupFailed({
            key: key1,
            error: Error('We havin a bad time'),
            feedLabel: '{"data":{"data":{"foo":"bar"},"id":"0"}}',
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
            subscriptions: {},
          },
        })
        const config = { ...epicDependencies.config, unhealthyThreshold: -1 }
        const output$ = warmupUnsubscriber(action$, state$, { config })
        expectObservable(output$).toBe('', {})
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
        const state$ = stateStream({
          cacheWarmer: {
            warmups: {
              [key2]: {
                error: null,
                errorCount: 0,
                successCount: 0,
              },
            },
            subscriptions: {
              [key2]: {
                executeFn: async () => ({} as AdapterResponse<AdapterData>),
                origin: adapterRequest2.data,
                startedAt: Date.now(),
                isDuplicate: false,
                batchablePropertyPath: [{ name: 'foo' }],
                childLastSeenById: {
                  [key2]: 2,
                },
              },
            },
          },
        })
        const output$ = warmupUnsubscriber(action$, state$, epicDependencies)
        expectObservable(output$, '^ 120m !').toBe('50m -- a 9m 59s 998ms b 40m - a', {
          a: actions.warmupSubscriptionTimeoutReset({ key: key1 }),
          b: actions.warmupUnsubscribed({ key: key2, isBatched: true, reason: 'Timeout' }),
        })
      })
    })
  })
})
