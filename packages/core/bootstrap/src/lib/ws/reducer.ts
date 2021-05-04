import hash from 'object-hash'
import { AdapterRequest } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import * as actions from './actions'
import { WSConfig } from './types'
import { getHashOpts } from '../util'

export const getSubsId = (subscriptionMsg = {}): string => hash(subscriptionMsg, getHashOpts())
export interface ConnectionsState {
  /** Map of all connections by key */
  active: {
    [key: string]: WSConfig
  }
  connecting: {
    [key: string]: number // Filter if its more than one
  }
  /** Number of active connections */
  total: number
}

const initConnectionsState: ConnectionsState = { active: {}, connecting: {}, total: 0 }

export const connectionsReducer = createReducer<ConnectionsState>(
  initConnectionsState,
  (builder) => {
    builder.addCase(actions.connected, (state, action) => {
      // Add connection
      const { key } = action.payload.config.connectionInfo
      state.active[key] = action.payload.config
      state.connecting[key] = 0
      // Increment num of active connections
      state.total++
    })

    builder.addCase(actions.connect, (state, action) => {
      const { key } = action.payload.config.connectionInfo
      const isActive = !!state.active[key]
      if (isActive) return
      
      const isConnecting = !isNaN(Number(state.connecting[key]))
      state.connecting[key] = isConnecting ? state.connecting[key] + 1 : 1
    })

    builder.addCase(actions.connectionError, (state, action) => {
      state.connecting[action.payload.connectionInfo.key] = 0
      delete state.active[action.payload.connectionInfo.key]
    })

    builder.addCase(actions.disconnected, (state, action) => {
      // Remove connection
      const { key } = action.payload.config.connectionInfo
      delete state.active[key]
      // Decrement num of active connections
      state.total--
    })
  },
)

export interface SubscriptionsState {
  /** Map of all subscriptions by key */
  [key: string]: {
    active: boolean
    subscribing: number
    input: AdapterRequest
  }
}

const initSubscriptionsState: SubscriptionsState = {}

export const subscriptionsReducer = createReducer<SubscriptionsState>(
  initSubscriptionsState,
  (builder) => {
    builder.addCase(actions.subscribed, (state, action) => {
      // Add subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      state[key] = {
        active: true,
        subscribing: 0,
        input: { ...action.payload.input },
      }
    })

    builder.addCase(actions.subscribe, (state, action) => {
      const key = getSubsId(action.payload.subscriptionMsg)
      const isActive = state[key]?.active
      if (isActive) return

      const isSubscribing = state[key]?.subscribing
      state[key] = {
        active: false,
        subscribing: isSubscribing ? state[key].subscribing + 1 : 1,
        input: { ...action.payload.input },
      }
    })

    builder.addCase(actions.unsubscribed, (state, action) => {
      // Remove subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      delete state[key]
    })

    builder.addCase(actions.disconnected, (state) => {
      state = {}
      return state
    })
  },
)

export const rootReducer = combineReducers({
  connections: connectionsReducer,
  subscriptions: subscriptionsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
