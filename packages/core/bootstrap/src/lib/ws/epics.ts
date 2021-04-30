import { Execute } from '@chainlink/types'
import { AnyAction } from 'redux'
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable'
import { merge, Subject, of, race } from 'rxjs'
import {
  catchError,
  delay,
  endWith,
  filter,
  map,
  mergeMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators'
import { webSocket } from 'rxjs/webSocket'
import WebSocket from 'ws'
import { withCache } from '../cache'
import { logger } from '../external-adapter'
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
  heartbeat,
  connectionError,
  WSErrorPayload,
} from './actions'
import {
  ws_connection_active,
  ws_message_total,
  ws_subscription_active,
  ws_subscription_total,
  ws_connection_errors
} from './metrics'
import { getSubsId } from './reducer'

const log = (message: any, withInput = false) => tap((input: any) => { withInput ? logger.info(`${message}: ${JSON.stringify(input)}`) : logger.info(message) })

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
    // GEt track of connection status from the state
    filter(([{ connectionKey }, state]) => {
      // If there is not an active connection and we are not loading any, lets it pass
      return !state.ws.connections.active[connectionKey] && state.ws.connections.connecting[connectionKey] <= 1
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
      const open$ = openObserver.pipe(
        map(() => connected({ config, wsHandler })),
        log('WS: New connection')
      )
      // Before disconecting, we make sure the subscription state is clean
      const close$ = closeObserver.pipe(
        map(() => disconnected({ config, wsHandler })),
        log('WS: Disconnection'),
        log(`WS: Removing every subscription`)
      )

      // Close the WS connection on disconnect
      const disconnect$ = action$.pipe(
        filter(disconnect.match),
        filter(({ payload }) => payload.config.connectionInfo.key === connectionKey),
        tap(() => wsSubject.closed || wsSubject.complete()),
        filter(() => false), // do not duplicate events
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
                /**
                 * If the error in on the subscription, next requests will try to subscribe
                 * If the error happens during a subscription, and is only eventual, can be ignored
                 * If the error happens during a subscription, and the subscription stop receiving messages, the unresponsiveTimeout will take care of it (unsubs/subs)
                 */
                if (wsHandler.isError(message)) {
                  logger.error(`WS: Subscription Error: ${JSON.stringify(message)}`)
                  return false
                }
                return getSubsId(wsHandler.subsFromMessage(message)) === subscriptionKey
              },
            )
            .pipe(
              withLatestFrom(state$),
              mergeMap(([message, state]) => {
                if (!state.ws.subscriptions[subscriptionKey]?.active) {
                  return of(subscribed(payload), messageReceived({ message, subscriptionKey })).pipe(
                    log(`WS: New subscription ${JSON.stringify(payload.subscriptionMsg)}`),
                    take(1),
                  )
                }
                return of(messageReceived({ message, subscriptionKey }))
              }),
              takeUntil(
                // unsubscribe or disconnected
                merge(
                  action$.pipe(
                    filter(unsubscribe.match),
                    filter((a) => getSubsId(a.payload.subscriptionMsg) === subscriptionKey),
                    log(`WS: Unsubscription ${JSON.stringify(payload.subscriptionMsg)}`),
                  ),
                  action$.pipe(
                    filter(disconnected.match),
                    filter((a) => a.payload.config.connectionInfo.key === connectionKey),
                  ),
                ),
              ),
              endWith(unsubscribed(payload)),
            )
        ),
        catchError((e) => {
          logger.error(e)
          return of(connectionError({ connectionInfo: { key: connectionKey, url }, message: e.message }))
        })
      )

      const messages$ = action$.pipe(
        filter(messageReceived.match),
        filter((action) => wsHandler.filter(action.payload.message)),
        withLatestFrom(state$),
        mergeMap(async ([action, state]) => {
          try {
            const input = state.ws.subscriptions[action.payload.subscriptionKey]?.input || {}
            if (!input) logger.warn(`WS: Could not find subscription from incoming message`)
            const response = wsHandler.toResponse(action.payload.message)
            if (!response) return action
            const execute: Execute = () => Promise.resolve(response)
            const cache = await withCache(execute)
            const wsResponse = {
              ...input,
              data: {
                ...input.data,
                maxAge: -1 // Force cache set
              },
              debug: {
                ws: true
              }
            }
            await cache(wsResponse)
          } catch (e) {
            logger.error(`WS: Cache error: ${e.message}`)
          }
          return action
        }),
        filter(() => false)
      )

      const heartbeat$ = action$.pipe(
        filter(heartbeat.match),
        map((action) => ({ ...action, subscriptionKey: getSubsId(action.payload.subscriptionMsg) })),
      )
      // Once a request happens, a subscription timeout starts. If no more requests ask for this susbcription before the time runs out, it will be unsubscribed
      const unsubscribeOnTimeout$ = heartbeat$.pipe(
        // when a subscription comes in
        mergeMap(({ payload, subscriptionKey }) => {
          // we look for matching subscriptions of the same type
          // which deactivates the current timer
          const reset$ = heartbeat$.pipe(
            filter(({ subscriptionKey: keyB }) => subscriptionKey === keyB),
            take(1)
          )
    
          // start the current unsubscription timer
          const timeout$ = of(unsubscribe({ ...payload })).pipe(delay(config.subscriptionTTL), log('WS: Unsubscription due to inactive feed'))
    
          // if a re-subscription comes in before timeout emits, then we emit nothing
          // else we unsubscribe from the current subscription
          return race(reset$, timeout$).pipe(filter((a) => !heartbeat.match(a)))
        }),
      )

      const messageReceived$ = action$.pipe(
        filter(messageReceived.match)
      )

      const unresponsiveOnTimeout$ = messageReceived$.pipe(
        withLatestFrom(state$),
        mergeMap(([{ payload: { subscriptionKey } }, state]) => {
          const input = state.ws.subscriptions[subscriptionKey]?.input || {}
          if (!input) logger.warn(`WS: Could not find subscription from incoming message`)
          const reset$ = messageReceived$.pipe(
            filter(({ payload }) => subscriptionKey === payload.subscriptionKey),
            take(1),
          )
    
          const action = {
            input,
            subscriptionMsg: wsHandler.subscribe({ ...input }),
            connectionInfo: {
              key: connectionKey,
              url
            }
          }

          const timeout$ = of(unsubscribe(action), subscribe(action)).pipe(
            delay(config.subscriptionUnresponsiveTTL),
            log('WS: Resubscription due to unresponsive channel')
          )
    
          return race(reset$, timeout$).pipe(filter((a) => !messageReceived.match(a)))
        }),
      )

      // Merge all & unsubscribe ws connection when a matching unsubscribe comes in
      const unsubscriptions$ = merge(unsubscribeOnTimeout$, unresponsiveOnTimeout$)
      const ws$ = merge(open$, close$, disconnect$, subscription$, messages$, unsubscriptions$).pipe(
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
        feed_id: getFeedId({ ...payload.input }), 
        subscription_key: getSubsId(payload.subscriptionMsg) 
      })
      const messageLabels = (payload: WSMessagePayload) => ({
        feed_id: getFeedId({ ...state.ws.subscriptions[action.payload.subscriptionKey]?.input }),
        subscription_key: payload.subscriptionKey,
      })
      const connectionErrorLabels = (payload: WSErrorPayload) => ({ 
        key: payload.connectionInfo.key, 
        url: payload.connectionInfo.url,
        message: payload.message
      })

      switch (action.type) {
        case connected.type:
          ws_connection_active.labels(connectionLabels(action.payload)).inc()
          break
        case connectionError.type:
          ws_connection_errors.labels(connectionErrorLabels(action.payload)).inc()
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
