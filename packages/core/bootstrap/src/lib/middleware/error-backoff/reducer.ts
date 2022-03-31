import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { makeId } from '../rate-limit'
import * as actions from './actions'
import { sortedFilter } from '../../util'

export enum IntervalNames {
  MINUTE = 'MINUTE',
}

export const Intervals: { [key: string]: number } = {
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
    [interval in IntervalNames]: number
  }
  participants: {
    [interval in IntervalNames]: Request[]
  }
}

export const initialRequestsState: RequestsState = {
  total: {
    MINUTE: 0,
  },
  participants: {
    MINUTE: [],
  },
}

export const requestReducer = createReducer<RequestsState>(initialRequestsState, (builder) => {
  builder.addCase(actions.requestObserved, (state) => {
    const time = Date.now()

    const storedIntervals = [IntervalNames.MINUTE]

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
  builder.addCase(actions.requestFailedObserved, (state, action) => {
    const request: Request = {
      id: makeId(action.payload.input),
      t: Date.now(),
    }
    const storedIntervals = [IntervalNames.MINUTE]

    for (const intervalName of storedIntervals) {
      // remove all requests that are older than the current interval
      const window = request.t - Intervals[intervalName]
      const isInWindow = (h: Request) => h.t >= window
      state.participants[intervalName] = sortedFilter<Request>(
        state.participants[intervalName],
        isInWindow,
      )

      // add new request
      state.participants[intervalName] = state.participants[intervalName].concat([request])

      // update total
      state.total[intervalName] = state.participants[intervalName].length
    }

    return state
  })

  builder.addCase(actions.shutdown, () => initialRequestsState)
})

export function selectParticiantsRequestsById(
  state: RequestsState,
  interval: IntervalNames,
  id: string,
): Request[] {
  const participants = state.participants[interval] ?? []
  return participants.filter((participant) => participant.id === id)
}

export const rootReducer = combineReducers({
  requests: requestReducer,
})
export type ErrorBackoffState = ReturnType<typeof rootReducer>
