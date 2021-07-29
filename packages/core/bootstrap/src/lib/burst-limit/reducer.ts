import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { makeId } from '../rate-limit'
import * as actions from './actions'

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
    [interval: string]: number
  }
  participants: {
    [participantId: string]: {
      [interval: string]: Request[]
    }
  }
}

export const initialRequestsState: RequestsState = {
  total: {},
  participants: {},
}

export const requestReducer = createReducer<RequestsState>(initialRequestsState, (builder) => {
  builder.addCase(actions.requestObserved, (state, action) => {
    const request: Request = {
      id: makeId(action.payload.input),
      t: Date.now(),
    }
    const { id } = request
    // Init if first time seeing this id
    if (!state.participants[id]) {
      state.participants[id] = {
        MINUTE: [],
      }
    }

    state.participants[id][IntervalNames.MINUTE] = state.participants[id][
      IntervalNames.MINUTE
    ].concat([request])

    let newTotal = 0

    for (const participantId of Object.keys(state.participants)) {
      // remove all requests that are older than the current interval
      const window = request.t - Intervals[IntervalNames.MINUTE]
      const isInWindow = (h: Request) => h.t >= window
      state.participants[participantId][IntervalNames.MINUTE] = sortedFilter(
        state.participants[participantId][IntervalNames.MINUTE],
        isInWindow,
      )
      const newLength = state.participants[participantId][IntervalNames.MINUTE].length
      if (newLength === 0) delete state.participants[participantId]
      newTotal = newTotal + newLength
    }

    state.total[IntervalNames.MINUTE] = newTotal

    return state
  })
})

/**
 * Remove stale request entries from an array.
 * This function assumes that the array is sorted by timestamp,
 * where the oldest entry lives in the 0th index, and the newest entry
 * lives in the arr.length-1th index
 * @param requests The requests to filter
 * @param filter The windowing function to apply
 */
export function sortedFilter(
  requests: Request[],
  windowingFunction: (h: Request) => boolean,
): Request[] {
  // if we want a higher performance implementation
  // we can later resort to a custom array class that is circular
  // so we can amortize expensive operations like resizing, and make
  // operations like moving the head index much quicker
  const firstNonStaleRequestIndex = requests.findIndex(windowingFunction)
  if (firstNonStaleRequestIndex === -1) {
    return []
  }

  return requests.slice(firstNonStaleRequestIndex)
}

export function selectTotalNumberOfRequestsFor(
  state: RequestsState,
  interval: IntervalNames,
): number {
  return state.total[interval] ?? 0
}

export function selectParticiantsRequestsFor(
  state: RequestsState,
  interval: IntervalNames,
  id: string,
): Request[] {
  return state.participants[id]?.[interval] ?? []
}

export const rootReducer = combineReducers({
  requests: requestReducer,
})
export type BurstLimitState = ReturnType<typeof rootReducer>
