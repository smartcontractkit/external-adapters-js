import { combineReducers, createReducer } from '@reduxjs/toolkit'
import * as actions from './actions'
import { WSConfig } from './types'

export interface ConnectionsState {
  /** Map of all connections by key */
  active: {
    [key: string]: WSConfig
  }
  /** Number of active connections */
  total: number
}

const initConnectionsState: ConnectionsState = { active: {}, total: 0 }

export const connectionsReducer = createReducer<ConnectionsState>(
  initConnectionsState,
  (builder) => {
    builder.addCase(actions.connected, (state, action) => {
      // Add connection
      const { key } = action.payload.config.connectionInfo
      state.active[key] = action.payload.config
      // Increment num of active connections
      state.total++
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
  active: {
    [key: string]: boolean
  }
  /** Number of active subscriptions */
  total: number
}

const initSubscriptionsState: SubscriptionsState = { active: {}, total: 0 }

export const subscriptionsReducer = createReducer<SubscriptionsState>(
  initSubscriptionsState,
  (builder) => {
    builder.addCase(actions.subscribed, (state, action) => {
      // Add connection
      const { key } = action.payload.subscriptionInfo
      state.active[key] = true
      // Increment num of active connections
      state.total++
    })

    builder.addCase(actions.unsubscribed, (state, action) => {
      // Remove connection
      const { key } = action.payload.subscriptionInfo
      delete state.active[key]
      // Decrement num of active connections
      state.total--
    })
  },
)

export const rootReducer = combineReducers({
  connections: connectionsReducer,
  subscriptions: subscriptionsReducer,
})
export type RootState = ReturnType<typeof rootReducer>
