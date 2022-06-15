import type { AdapterContext, AdapterRequest, AdapterResponse, Execute } from '../../../src/types'
import { createStore, combineReducers, Store } from 'redux'
import { useFakeTimers, SinonFakeTimers } from 'sinon'
import { withMiddleware } from '../../../src/index'
import { withDebug } from '../../../src/lib/middleware/debugger'
import { defaultOptions, withCache } from '../../../src/lib/middleware/cache'
import * as cacheWarmer from '../../../src/lib/middleware/cache-warmer'
import * as rateLimit from '../../../src/lib/middleware/rate-limit'
import { get } from '../../../src/lib/config/provider-limits/config'

export const newStore = (): ReturnType<typeof createStore> => {
  const initState = { cacheWarmer: {}, rateLimit: {} }
  const rootReducer = combineReducers({
    cacheWarmer: cacheWarmer.reducer.rootReducer,
    rateLimit: rateLimit.reducer.rootReducer,
  })
  const store = createStore(rootReducer, initState)
  return store
}

export const makeExecuteWithWarmer = async (
  execute: Execute,
  store: Store,
): Promise<(request: AdapterRequest) => Promise<AdapterResponse>> => {
  const options = defaultOptions()
  const context: AdapterContext = {
    cache: {
      ...defaultOptions(),
      instance: await options.cacheBuilder(options.cacheImplOptions),
    },
    rateLimit: { http: {}, ws: {} },
    limits: get(undefined, {}),
  }
  const executeWithMiddleware = await withMiddleware(execute, context, [
    withCache(),
    rateLimit.withRateLimit({
      getState: () => store.getState().rateLimit,
      dispatch: (a) => store.dispatch(a),
    } as Store),
    withDebug(),
  ])
  return async (request: AdapterRequest) => {
    const response = await executeWithMiddleware(request, context)
    store.dispatch(
      cacheWarmer.actions.warmupSubscribed({
        id: request.id,
        executeFn: executeWithMiddleware,
        data: request,
      } as unknown as cacheWarmer.actions.WarmupSubscribedPayload),
    )
    return response
  }
}

export const dataProviderMock = (cost = 1): { execute: Execute } => {
  return {
    execute: async (request) => {
      return {
        jobRunID: request.id,
        data: {
          result: '',
          cost,
          rateLimitMaxAge: request.data?.rateLimitMaxAge,
          statusCode: 200,
        },
        result: '',
        statusCode: 200,
      }
    },
  }
}

export const getRLTokenSpentPerMinute = (
  hearbeats: rateLimit.reducer.Heartbeats,
): {
  [key: number]: number
} => {
  const allResponses = Object.keys(hearbeats.participants).flatMap(
    (id) => hearbeats.participants[id][rateLimit.reducer.IntervalNames.HOUR],
  )
  const responses = allResponses
    .filter((r) => !r.h)
    .map((r) => ({
      ...r,
      minute: new Date(r.t).getMinutes(),
    }))
  const rlPerMin: { [key: number]: number } = {}
  responses.forEach((r) => {
    if (rlPerMin[r.minute]) {
      rlPerMin[r.minute] += 1 * r.c
    } else {
      rlPerMin[r.minute] = 1 * r.c
    }
  })
  return rlPerMin
}

export function setupClock(): readonly [SinonFakeTimers, () => void] {
  const clock = useFakeTimers()
  return [
    clock,
    () => {
      clock.restore()
    },
  ] as const
}
