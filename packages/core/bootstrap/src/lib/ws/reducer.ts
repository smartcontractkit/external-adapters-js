import hash from 'object-hash'
import { AdapterRequest } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import * as actions from './actions'
import { WSConfig } from './types'
import { getHashOpts } from '../util'
import { logger } from '../external-adapter'

export const getSubsId = (subscriptionMsg: any): string => hash(subscriptionMsg, getHashOpts())

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
      logger.debug('WS: New connection')
      // Add connection
      const { key } = action.payload.config.connectionInfo
      state.active[key] = action.payload.config
      // Increment num of active connections
      state.total++
    })

    builder.addCase(actions.disconnected, (state, action) => {
      logger.debug('WS: Disconnection')
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
  input: {
    [key: string]: AdapterRequest
  }
  /** Number of active subscriptions */
  total: number
}

const initSubscriptionsState: SubscriptionsState = { active: {}, input: {}, total: 0 }

export const subscriptionsReducer = createReducer<SubscriptionsState>(
  initSubscriptionsState,
  (builder) => {
    builder.addCase(actions.subscribed, (state, action) => {
      logger.debug('WS: New subscription')
      // Add subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      state.active[key] = true
      state.input[key] = { ...action.payload.input }
      // Increment num of active subscriptions
      state.total++
    })

    builder.addCase(actions.unsubscribed, (state, action) => {
      logger.debug('WS: Unsubscription')
      // Remove subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      delete state.active[key]
      // Decrement num of active subscriptions
      state.total--
    })
  },
)

export const rootReducer = combineReducers({
  connections: connectionsReducer,
  subscriptions: subscriptionsReducer,
})
export type RootState = ReturnType<typeof rootReducer>
