import { createReducer, combineReducers } from '@reduxjs/toolkit'
import { WARMUP_REQUEST_ID } from '../cache-warmer/config'
import { successfulRequestObserved, responseObserved, requestObserved } from './actions'

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

const heartbeatReducer = createReducer<Heartbeats>(initialHeartbeatsState, (builder) => {
  builder.addCase(successfulRequestObserved, (state, action) => {
    const heartbeat: Heartbeat = {
      id: action.payload.typeId,
      cost: action.payload.cost,
      timestamp: Date.parse(action.payload.createdAt),
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

interface RequestMetric {
  id: string
  data: any
  timestamp: number
  isWarmup: boolean
}

interface ResponseMetric {
  id: string
  data: any
  success: boolean
  timestamp: number
  rlMaxAge: number
  latency: number[]
  cost: number
  cached: boolean
  maxAgeSet?: number
  ttl?: number // Compare TTL with MaxAge Cap
}

export interface Metrics {
  requests: RequestMetric[]
  responses: ResponseMetric[]
}

const initialMetricsState: Metrics = {
  requests: [],
  responses: [],
}

const metricsReducer = createReducer<Metrics>(initialMetricsState, (builder) => {
  builder.addCase(requestObserved, (state, action) => {
    const request: RequestMetric = {
      id: action.payload.typeId,
      data: action.payload.data,
      timestamp: Date.parse(action.payload.createdAt),
      isWarmup: action.payload.data.id === WARMUP_REQUEST_ID,
    }
    state.requests.push(request)
    return state
  })

  builder.addCase(responseObserved, (state, action) => {
    const response: ResponseMetric = {
      id: action.payload.typeId,
      timestamp: Date.parse(action.payload.createdAt),
      success: action.payload.success,
      data: action.payload.data,
      rlMaxAge: action.payload.rlMaxAge,
      latency: action.payload.latency,
      cost: action.payload.cost,
      cached: action.payload.cached,
      maxAgeSet: action.payload.maxAgeSet,
      ttl: action.payload.ttl,
    }
    state.responses.push(response)
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
  metrics: metricsReducer,
})
export type RootState = ReturnType<typeof rootReducer>
