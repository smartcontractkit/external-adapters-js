import { createReducer, combineReducers } from '@reduxjs/toolkit'
import { Intervals } from './store'
import { newRequest } from './actions'
import { getParticipantId } from './util'

export interface Heartbeat {
  timestamp: number
  cost: number
  id: string
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

const DEFAULT_COST = 1

const initialState: StateTree = {
  total: {
    SEC: [],
    MINUTE: [],
    HOUR: [],
    DAY: [],
    ALL: [],
  },
  participants: {},
}

const heartbeatReducer = createReducer<StateTree>(initialState, (builder) => {
  builder.addCase(newRequest, (state, action) => {
    const timestamp = Date.now()
    const id = getParticipantId(action.payload.data)
    const heartbeat: Heartbeat = {
      id,
      cost: Number(action.payload.cost) || DEFAULT_COST,
      timestamp,
    }
    if (!state.participants[id]) {
      state.participants[id] = {
        SEC: [],
        MINUTE: [],
        HOUR: [],
        DAY: [],
        ALL: [],
      }
    }

    state.total.ALL.push(heartbeat)
    state.participants[id].ALL.push(heartbeat)

    for (const [intervalName, interval] of Object.entries(Intervals)) {
      const window = timestamp - interval
      state.total[intervalName].push(heartbeat)
      state.participants[id][intervalName].push(heartbeat)

      state.total[intervalName] = state.total[intervalName].filter((h) => h.timestamp >= window)
      state.participants[id][intervalName] = state.participants[id][intervalName].filter(
        (h) => h.timestamp >= window,
      )
    }

    return state
  })
})

export default combineReducers({
  heartbeats: heartbeatReducer,
})
