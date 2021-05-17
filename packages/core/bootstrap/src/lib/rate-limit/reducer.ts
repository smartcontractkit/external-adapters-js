import { createReducer, combineReducers } from '@reduxjs/toolkit'
import { makeId } from '.'
import { WARMUP_REQUEST_ID } from '../cache-warmer/config'
import { successfulRequestObserved } from './actions'

export enum IntervalNames {
  SEC = 'SEC',
  MINUTE = 'MINUTE',
  HOUR = 'HOUR',
  DAY = 'DAY',
}

export const Intervals: { [key: string]: number } = {
  [IntervalNames.SEC]: 1000,
  [IntervalNames.MINUTE]: 60 * 1000,
  [IntervalNames.HOUR]: 60 * 60 * 1000,
  [IntervalNames.DAY]: 24 * 60 * 60 * 1000,
}
export interface Heartbeat {
  id: string
  cost: number
  timestamp: number
  isCacheHit: boolean
  isWarmup: boolean
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
  SEC: [],
  MINUTE: [],
  HOUR: [],
  DAY: [],
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
      cost: action.payload.response.data.cost || DEFAULT_COST,
      timestamp: Date.parse(action.payload.createdAt),
      isWarmup: action.payload.input.id === WARMUP_REQUEST_ID,
      isCacheHit: !!action.payload.response.maxAge,
    }

    const { id } = heartbeat
    // Init if first time seeing this id
    if (!state.participants[id]) state.participants[id] = initialIntervalsState()

    for (const [intervalName, interval] of Object.entries(Intervals)) {
      state.total[intervalName].push(heartbeat)
      state.participants[id][intervalName].push(heartbeat)

      const window = heartbeat.timestamp - interval
      const _inWindow = (h: Heartbeat) => h.timestamp >= window

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
