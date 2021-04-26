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
      logger.info('WS: New connection')
      // Add connection
      const { key } = action.payload.config.connectionInfo
      state.active[key] = action.payload.config
      // Increment num of active connections
      state.total++
    })

    builder.addCase(actions.disconnected, (state, action) => {
      logger.info('WS: Disconnection')
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
    input: AdapterRequest
    lastSeen: number
  }
}

const initSubscriptionsState: SubscriptionsState = {}

export const subscriptionsReducer = createReducer<SubscriptionsState>(
  initSubscriptionsState,
  (builder) => {
    builder.addCase(actions.subscribed, (state, action) => {
      logger.info(`WS: New subscription ${JSON.stringify(action.payload.subscriptionMsg)}`)
      // Add subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      state[key] = {
        active: true,
        input: { ...action.payload.input },
        lastSeen: Date.now()
      }
      // Increment num of active subscriptions
    })

    builder.addCase(actions.unsubscribed, (state, action) => {
      logger.info(`WS: Unsubscription ${JSON.stringify(action.payload.subscriptionMsg)}`)
      // Remove subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      delete state[key]
    })

    builder.addCase(actions.disconnected, (state) => {
      logger.info(`WS: Removing every subscription`)
      state = {}
    })

    builder.addCase(actions.heartbeat, (state, action) => {
      logger.debug(`WS: New request`)
      const key = getSubsId(action.payload.subscriptionMsg)
      if (state[key]) {
        state[key].lastSeen = Date.now()
      }
    })
  },
)

export const rootReducer = combineReducers({
  connections: connectionsReducer,
  subscriptions: subscriptionsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
