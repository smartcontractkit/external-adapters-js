import { Execute } from '@chainlink/types'
import { AnyAction } from 'redux'
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable'
import { from, merge, Subject, interval } from 'rxjs'
import {
  endWith,
  filter,
  map,
  mergeMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators'
import { webSocket } from 'rxjs/webSocket'
import WebSocket from 'ws'
import { withCache } from '../cache'
import { logger, Requester } from '../external-adapter'
import { getFeedId } from '../metrics/util'
import {
  connect,
  connected,
  disconnect,
  disconnected,
  subscribe,
  subscribed,
  unsubscribe,
  unsubscribed,
  messageReceived,
  WSConfigPayload,
  WSSubscriptionPayload,
  WSMessagePayload,
} from './actions'
import {
  ws_connection_active,
  ws_message_total,
  ws_subscription_active,
  ws_subscription_total,
} from './metrics'
import { getSubsId, SubscriptionsState } from './reducer'

// Rxjs deserializer defaults to JSON.parse. We need to handle errors from non-parsable messages
const deserializer = (message: any) => {
  try {
    return JSON.parse(message.data)
  } catch (e) {
    logger.debug('WS: Message received with invalid format')
    return message
  }
}

export const connectEpic: Epic<AnyAction, AnyAction, any, any> = (action$, state$) =>
  action$.pipe(
    filter(connect.match),
    map(({ payload }) => ({ payload, connectionKey: payload.config.connectionInfo.key })),
    // check if the connection already exists, then noop
    withLatestFrom(state$),
    filter(([{ connectionKey }, state]) => {
      // if connection does not exist, then continue
      return !state.ws.connections.active[connectionKey]
    }),
    // on a connect action being dispatched, open a new WS connection if one doesn't exist yet
    mergeMap(([{ connectionKey, payload }]) => {
      const { config, wsHandler } = payload
      const { connection: { url, protocol } } = wsHandler

      const openObserver = new Subject()
      const closeObserver = new Subject()
      const WebSocketCtor = WebSocket
      const wsSubject = webSocket({
        url,
        protocol, // TODO: Double check this
        deserializer,
        openObserver,
        closeObserver,
        WebSocketCtor: WebSocketCtor as any, // TODO: fix types don't match
      })
      
      // Stream of WS connected & disconnected events
      const open$ = openObserver.pipe(map(() => connected({ config, wsHandler })))
      // Before disconecting, we make sure the subscription state is clean
      const close$ = closeObserver.pipe(map(() => disconnected({ config, wsHandler })))

      // Close the WS connection on disconnect
      const disconnect$ = action$.pipe(
        filter(disconnect.match),
        filter(({ payload }) => payload.config.connectionInfo.key === connectionKey),
        tap(() => wsSubject.closed || wsSubject.complete()),
        filter(() => false), // do not duplicate events
      )
        
      // Every 3 seconds checks used subscriptions. Is considered used if the time since its last request is less than "subscriptionTTL"
      const heartbeat$ = interval(3000).pipe(
        withLatestFrom(state$),
        mergeMap(([_, state]) => 
          from(Object.values(state.ws.subscriptions as SubscriptionsState)).pipe(
            filter((subscription) => {
              return Date.now() - subscription.lastSeen > config.subscriptionTTL
            }),
            map(({ input }) => {
              return unsubscribe({
                input,
                subscriptionMsg: wsHandler.subscribe({...input}),
                connectionInfo: {
                  key: connectionKey,
                  url
                }
              })
            })
          )
        )
      )

      // Multiplex subscriptions
      const subscription$ = action$.pipe(
        filter(subscribe.match),
        filter(({ payload }) => payload.connectionInfo.key === connectionKey),
        map(({ payload }) => ({ payload, subscriptionKey: getSubsId(payload.subscriptionMsg) })),
        withLatestFrom(state$),
        filter(([{ subscriptionKey }, state]) => {
          // if subscription does not exist, then continues
          return !state.ws.subscriptions[subscriptionKey]?.active
        }),
        // on a subscribe action being dispatched, open a new WS subscription if one doesn't exist yet
        mergeMap(([{ subscriptionKey, payload }]) =>
          wsSubject
            .multiplex(
              () => payload.subscriptionMsg,
              () => wsHandler.unsubscribe(payload.input),
              (message) => {
                if (wsHandler.isError(message)) {
                  logger.warn(`WS: Subscription Error: ${JSON.stringify(message)}`)
                  return false
                }
                return getSubsId(wsHandler.subsFromMessage(message)) === subscriptionKey
              },
            )
            .pipe(
              withLatestFrom(state$),
              map(([message, state]) => {
                if (!state.ws.subscriptions[subscriptionKey]?.active) {
                  return subscribed(payload)
                }
                return messageReceived({ message, subscriptionKey })
              }),
              takeUntil(
                // unsubscribe or disconnected
                merge(
                  action$.pipe(
                    filter(unsubscribe.match),
                    filter((a) => getSubsId(a.payload.subscriptionMsg) === subscriptionKey),
                  ),
                  action$.pipe(
                    filter(disconnected.match),
                    filter((a) => a.payload.config.connectionInfo.key === connectionKey),
                  ),
                ),
              ),
              endWith(unsubscribed(payload)),
            )
          )
      )

      const messages$ = action$.pipe(
        filter(messageReceived.match),
        filter((action) => wsHandler.filter(action.payload.message)),
        withLatestFrom(state$),
        map(([action, state]) => {
          // We need to identify the subscription correspoding to the message
          const input = state.ws.subscriptions[action.payload.subscriptionKey]?.input
          if (!input) logger.warn(`WS: Could not find subscription from incoming message`)
          return { ...action, input: input || {} }
        }),
        mergeMap(async (action) => {
          const response = wsHandler.parse(action.payload.message)
          if (!response) return action
          const adapterResponse = wsHandler.toAdapterResponse || ((result: any) => Requester.success('1', { data: { result } }))
          const execute: Execute = () => Promise.resolve(adapterResponse(response))
          const cache = await withCache(execute)
          const input = {
            ...action.input,
            data: {
              ...action.input.data,
              maxAge: -1
            },
            debug: {
              ws: true
            }
          }
          await cache(input)
          return action
        }),
        filter(() => false)
      )

      // Merge all & unsubscribe ws connection when a matching unsubscribe comes in
      const ws$ = merge(open$, close$, disconnect$, subscription$, messages$, heartbeat$).pipe(
        takeUntil(
          action$.pipe(
            // TODO: not seeing unsubscribe events because of this
            filter(disconnected.match),
            filter((a) => a.payload.config.connectionInfo.key === connectionKey),
          ),
        ),
      )

      // Return the new connection stream
      return ws$
    }),
  )

export const metricsEpic: Epic<AnyAction, AnyAction, any, any> = (action$, state$) =>
  action$.pipe(
    withLatestFrom(state$),
    tap(([action, state]) => {
      const connectionLabels = (payload: WSConfigPayload) => ({ 
        key: payload.config.connectionInfo.key, 
        url: payload.wsHandler.connection.url 
      })
      const subscriptionLabels = (payload: WSSubscriptionPayload) => ({ 
          connection_key: payload.connectionInfo.key, 
          connection_url: payload.connectionInfo.url, 
          feed_id: getFeedId(payload.input), 
          subscription_key: getSubsId(payload.subscriptionMsg) 
        })
      const messageLabels = (payload: WSMessagePayload) => ({
          feed_id: getFeedId({ ...state.ws.subscriptions.input[action.payload.subscriptionKey] }),
          subscription_key: payload.subscriptionKey,
        })

      switch (action.type) {
        case connected.type:
          ws_connection_active.labels(connectionLabels(action.payload)).inc()
          break
        case disconnected.type:
          ws_connection_active.labels(connectionLabels(action.payload)).dec()
          break
        case subscribed.type:
          ws_subscription_total.labels(subscriptionLabels(action.payload)).inc()
          ws_subscription_active.labels(subscriptionLabels(action.payload)).inc()
          break
        case unsubscribed.type:
          ws_subscription_active.labels(subscriptionLabels(action.payload)).dec()
          break
        case messageReceived.type:
          ws_message_total.labels(messageLabels(action.payload)).inc()
          break
      }
    }),
    map(([action]) => action),
    filter(() => false), // do not duplicate events
  )

export const rootEpic = combineEpics(connectEpic, metricsEpic)

export const epicMiddleware = createEpicMiddleware()
