import { createReducer, combineReducers } from '@reduxjs/toolkit'
import { requestObserved } from './actions'

export interface Interval {
  [key: string]: number
}

export enum IntervalNames {
  SEC = 'SEC',
  MINUTE = 'MINUTE',
  HOUR = 'HOUR',
  DAY = 'DAY',
}

export const Intervals: Interval = {
  [IntervalNames.SEC]: 1000,
  [IntervalNames.MINUTE]: 60 * 1000,
  [IntervalNames.HOUR]: 60 * 60 * 1000,
  [IntervalNames.DAY]: 24 * 60 * 60 * 1000,
}
export interface Heartbeat {
  id: string
  cost: number
  timestamp: number
}

export interface StateTree {
  total: {
    [interval: string]: Heartbeat[]
  }
  participants: {
    [participantId: string]: {
      [interval: string]: Heartbeat[]
    }
  }
}

const initialTimeWindowsState = () => ({
  SEC: [],
  MINUTE: [],
  HOUR: [],
  DAY: [],
})

const initialState: StateTree = {
  total: initialTimeWindowsState(),
  participants: {},
}

const heartbeatReducer = createReducer<StateTree>(initialState, (builder) => {
  builder.addCase(requestObserved, (state, action) => {
    const heartbeat: Heartbeat = {
      id: action.payload.requestId,
      cost: action.payload.cost,
      timestamp: Date.parse(action.payload.createdAt),
    }

    if (!state.participants[heartbeat.id]) {
      state.participants[heartbeat.id] = initialTimeWindowsState()
    }

    const { id } = heartbeat
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

export default combineReducers({
  heartbeats: heartbeatReducer,
})
