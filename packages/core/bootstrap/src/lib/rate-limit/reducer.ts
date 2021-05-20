import { createReducer, combineReducers } from '@reduxjs/toolkit'
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
  /**
   * isWarmupHit
   */
  w: boolean
}

export interface Heartbeats {
  total: {
    [interval: string]: Heartbeat[]
  }
  participants: {
    [participantId: string]: {
      [interval: string]: Heartbeat[]
    }
  }
}

const initialIntervalsState = () => ({
  MINUTE: [],
  HOUR: [],
})

const initialHeartbeatsState: Heartbeats = {
  total: initialIntervalsState(),
  participants: {},
}

const DEFAULT_COST = 1

const heartbeatReducer = createReducer<Heartbeats>(initialHeartbeatsState, (builder) => {
  builder.addCase(successfulRequestObserved, (state, action) => {
    const heartbeat: Heartbeat = {
      id: makeId(action.payload.input),
      c: action.payload.response.data.cost || DEFAULT_COST,
      t: Date.parse(action.payload.createdAt),
      w: action.payload.input.id === WARMUP_REQUEST_ID,
      h: !!action.payload.response.maxAge,
    }

    const { id } = heartbeat
    // Init if first time seeing this id
    if (!state.participants[id]) state.participants[id] = initialIntervalsState()

    const storedIntervals = [IntervalNames.HOUR]

    for (const intervalName of storedIntervals) {
      state.total[intervalName].push(heartbeat)
      state.participants[id][intervalName].push(heartbeat)

      const window = heartbeat.t - Intervals[intervalName]
      const _inWindow = (h: Heartbeat) => h.t >= window

      state.total[intervalName] = state.total[intervalName].filter(_inWindow)
      state.participants[id][intervalName] = state.participants[id][intervalName].filter(_inWindow)
    }



    return state
  })
})

export const selectObserved = (
  state: Heartbeats,
  interval: IntervalNames,
  id?: string,
): Heartbeat[] => (id ? state.participants[id]?.[interval] || [] : state.total[interval] || [])

export const rootReducer = combineReducers({
  heartbeats: heartbeatReducer,
})
export type RootState = ReturnType<typeof rootReducer>
