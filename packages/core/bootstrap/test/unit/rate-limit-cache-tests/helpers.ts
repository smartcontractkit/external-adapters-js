import { AdapterRequest, Execute } from '@chainlink/types'
import { combineReducers, Store } from 'redux'
import { useFakeTimers } from 'sinon'
import { withDebug } from '../../../src'
import { withCache } from '../../../src/lib/cache'
import * as cacheWarmer from '../../../src/lib/cache-warmer'
import * as rateLimit from '../../../src/lib/rate-limit'
import { configureStore } from '../../../src/lib/store'

export const withMiddleware = async (execute: Execute, middlewares: any[]) => {
  for (let i = 0; i < middlewares.length; i++) {
    execute = await middlewares[i](execute)
  }
  return execute
}

export const newStore = () => {
  const initState = { cacheWarmer: {}, rateLimit: {} }
  const rootReducer = combineReducers({
    cacheWarmer: cacheWarmer.reducer.rootReducer,
    rateLimit: rateLimit.reducer.rootReducer,
  })
  cacheWarmer.epics.epicMiddleware.run(cacheWarmer.epics.rootEpic)
  return configureStore(rootReducer, initState, [cacheWarmer.epics.epicMiddleware])
}

export const makeExecuteWithWarmer = async (execute: Execute, store: Store) => {
  const executeWithMiddleware = await withMiddleware(execute, [
    withCache,
    rateLimit.withRateLimit({
      getState: () => store.getState().rateLimit,
      dispatch: (a) => store.dispatch(a),
    } as Store),
    withDebug
  ])
  return async (data: AdapterRequest) => {
    const result = await executeWithMiddleware(data)
    store.dispatch(
      cacheWarmer.actions.warmupSubscribed({
        id: data.id,
        executeFn: executeWithMiddleware,
        data,
      } as cacheWarmer.actions.WarmupSubscribedPayload),
    )
    return result
  }
}

export const dataProviderMock = (cost = 1): { execute: Execute } => {
  return {
    execute: async (request): Promise<any> => {
      return {
        jobRunID: request.id,
        data: {
          result: '',
          cost,
          rateLimitMaxAge: request.data?.rateLimitMaxAge,
        },
        result: '',
        statusCode: 200,
      }
    },
  }
}

export const getRLTokenSpentPerMinute = (hearbeats: rateLimit.reducer.Heartbeats) => {
  const responses = hearbeats.total[rateLimit.reducer.IntervalNames.DAY]
    .filter((r) => !r.isCacheHit)
    .map((r) => ({
      ...r,
      minute: new Date(r.timestamp).getMinutes(),
    }))
  const rlPerMin: { [key: number]: number } = {}
  responses.forEach((r) => {
    if (rlPerMin[r.minute]) {
      rlPerMin[r.minute] += 1 * r.cost
    } else {
      rlPerMin[r.minute] = 1 * r.cost
    }
  })
  return rlPerMin
}

export function setupClock() {
  const clock = useFakeTimers()
  return [
    clock,
    () => {
      clock.restore()
    },
  ] as const
}
