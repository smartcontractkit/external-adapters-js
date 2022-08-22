import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { sortedFilter } from '../../util'
import { makeId } from '../rate-limit'
import * as actions from './actions'

export enum IntervalNames {
  SECOND = 'SECOND',
  MINUTE = 'MINUTE',
}

export const Intervals: { [key: string]: number } = {
  [IntervalNames.SECOND]: 1000,
  [IntervalNames.MINUTE]: 60 * 1000,
}

// Shortened names to reduce memory usage
export interface Request {
  id: string
  /**
   * Timestamp
   */
  t: number
}

export interface RequestsState {
  total: {
    [interval: string]: number
  }
  participants: {
    [interval: string]: Request[]
  }
}

export const initialRequestsState: RequestsState = {
  total: {
    SECOND: 0,
    MINUTE: 0,
  },
  participants: {
    SECOND: [],
    MINUTE: [],
  },
}

export const requestReducer = createReducer<RequestsState>(initialRequestsState, (builder) => {
  builder.addCase(actions.updateIntervals, (state) => {
    const time = Date.now()

    const storedIntervals = [IntervalNames.SECOND, IntervalNames.MINUTE]

    for (const intervalName of storedIntervals) {
      // remove all requests that are older than the current interval
      const window = time - Intervals[intervalName]
      const isInWindow = (h: Request) => h.t >= window
      state.participants[intervalName] = sortedFilter<Request>(
        state.participants[intervalName],
        isInWindow,
      )

      // update total
      state.total[intervalName] = state.participants[intervalName].length
    }

    return state
  })
  builder.addCase(actions.initialRequestObserved, (state) => {
    const t = Date.now()
    const storedIntervals = [IntervalNames.SECOND, IntervalNames.MINUTE]

    for (const intervalName of storedIntervals) {
      // remove all requests that are older than the current interval
      const window = t - Intervals[intervalName]
      const isInWindow = (h: Request) => h.t >= window
      state.participants[intervalName] = sortedFilter<Request>(
        state.participants[intervalName],
        isInWindow,
      )

      // update total
      state.total[intervalName] = state.participants[intervalName].length
    }

    return state
  })
  builder.addCase(actions.requestObserved, (state, action) => {
    const request: Request = {
      id: action.payload.input?.debug?.cacheKey ?? makeId(action.payload.input),
      t: Date.now(),
    }
    const storedIntervals = [IntervalNames.SECOND, IntervalNames.MINUTE]

    for (const intervalName of storedIntervals) {
      // add new request
      state.participants[intervalName] = state.participants[intervalName].concat([request])

      // update total
      state.total[intervalName] = state.participants[intervalName].length
    }

    return state
  })
})

export function selectTotalNumberOfRequestsFor(
  state: RequestsState,
  interval: IntervalNames,
): number {
  return state.total[interval] ?? 0
}

export function selectParticiantsRequestsFor(
  state: RequestsState,
  interval: IntervalNames,
): Request[] {
  return state.participants[interval] ?? []
}

export const rootReducer = combineReducers({
  requests: requestReducer,
})
export type BurstLimitState = ReturnType<typeof rootReducer>
export const initialState: BurstLimitState = {
  requests: {
    total: {
      SECOND: 0,
      MINUTE: 0,
    },
    participants: {
      SECOND: [],
      MINUTE: [],
    },
  },
}
