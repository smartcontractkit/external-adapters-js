import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { makeId } from '.'
import { WARMUP_REQUEST_ID } from '../cache-warmer/config'
import { successfulRequestObserved } from './actions'

export enum IntervalNames {
  MINUTE = 'MINUTE',
  HOUR = 'HOUR',
}

export const Intervals: { [key: string]: number } = {
  [IntervalNames.MINUTE]: 60 * 1000,
  [IntervalNames.HOUR]: 60 * 60 * 1000,
}

// Shortened names to reduce memory usage
export interface Heartbeat {
  id: string
  /**
   * Cost
   */
  c: number
  /**
   * Timestamp
   */
  t: number
  /**
   * isCacheHit
   */
  h: boolean
}

export interface Heartbeats {
  total: {
    [interval: string]: number
  }
  participants: {
    [participantId: string]: {
      [interval: string]: Heartbeat[]
    }
  }
}

const initialHeartbeatsState: Heartbeats = {
  total: {},
  participants: {},
}

const DEFAULT_COST = 1

const heartbeatReducer = createReducer<Heartbeats>(initialHeartbeatsState, (builder) => {
  builder.addCase(successfulRequestObserved, (state, action) => {
    const heartbeat: Heartbeat = {
      id: makeId(action.payload.input),
      c: action.payload.response.data.cost || DEFAULT_COST,
      t: Date.parse(action.payload.createdAt),
      h: !!action.payload.response.maxAge,
    }
    const { id } = heartbeat
    // Init if first time seeing this id
    if (!state.participants[id]) {
      state.participants[id] = {
        HOUR: [],
      }
    }
    const storedIntervals = [IntervalNames.HOUR]

    for (const intervalName of storedIntervals) {
      const prevLength = state.participants[id][intervalName].length
      /**
       * We skip adding warmup requests to state since
       * we dont use them anyway, but we still want to
       * re-compute throughtput on every incoming request
       */
      const isWarmupRequest = action.payload.input.id === WARMUP_REQUEST_ID
      if (!isWarmupRequest) {
        state.participants[id][intervalName] = state.participants[id][intervalName].concat([
          heartbeat,
        ])
      }

      // remove all heartbeats that are older than the current interval
      const window = heartbeat.t - Intervals[intervalName]
      const isInWindow = (h: Heartbeat) => h.t >= window
      state.participants[id][intervalName] = sortedFilter(
        state.participants[id][intervalName],
        isInWindow,
      )
      const newLength = state.participants[id][intervalName].length
      /**
       * We update our total observed heartbeats by the diff of this participants heartbeats length.
       * Ex. Let us have 5 observed heartbeats within the current hour interval across all
       * participants, then state.total[intervalName] = 5.
       * Let us have 3 observed heartbeats in the current participant, where 2 have just become stale,
       * since they are over an hour old.
       *
       * Then we have the following:
       * state.total[intervalName] = state.total[intervalName] + (newLength - prevLength)
       * state.total[HOUR] = state.total[HOUR] + (newLength - prevLength)
       * state.total[HOUR] = 5 + (1 - 3)
       * state.total[HOUR] = 5 + -2
       * state.total[HOUR] = 3
       */
      state.total[intervalName] = (state.total[intervalName] ?? 0) + (newLength - prevLength)
    }

    return state
  })
})

/**
 * Remove stale heartbeat entries from an array.
 * This function assumes that the array is sorted by timestamp,
 * where the oldest entry lives in the 0th index, and the newest entry
 * lives in the arr.length-1th index
 * @param heartbeats The heartbeats to filter
 * @param filter The windowing function to apply
 */
function sortedFilter(
  heartbeats: Heartbeat[],
  windowingFunction: (h: Heartbeat) => boolean,
): Heartbeat[] {
  // if we want a higher performance implementation
  // we can later resort to a custom array class that is circular
  // so we can amortize expensive operations like resizing, and make
  // operations like moving the head index much quicker
  const firstNonStaleHeartbeatIndex = heartbeats.findIndex(windowingFunction)
  if (firstNonStaleHeartbeatIndex === -1) {
    return []
  }

  return heartbeats.slice(firstNonStaleHeartbeatIndex)
}

export function selectTotalNumberOfHeartbeatsFor(
  state: Heartbeats,
  interval: IntervalNames,
): number {
  return (state.total[interval] ?? 0) + 1
}
export function selectParticiantsHeartbeatsFor(
  state: Heartbeats,
  interval: IntervalNames,
  id: string,
) {
  return state.participants[id]?.[interval] ?? []
}

export const rootReducer = combineReducers({
  heartbeats: heartbeatReducer,
})
export type RootState = ReturnType<typeof rootReducer>
