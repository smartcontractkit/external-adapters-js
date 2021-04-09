import { Execute } from '@chainlink/types'
import { AnyAction } from 'redux'
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable'
import { merge, of, Subject } from 'rxjs'
import {
  endWith,
  filter,
  map,
  mergeMap,
  startWith,
  takeUntil,
  tap,
  withLatestFrom,
  catchError
} from 'rxjs/operators'
import { webSocket } from 'rxjs/webSocket'
import WebSocket from 'ws'
import { withCache } from '../cache'
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
} from './actions'
import {
  ws_connection_active,
  ws_message_total,
  ws_subscription_active,
  ws_subscription_total,
} from './metrics'

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
      // const { url, protocol } = config.connectionInfo
      const openObserver = new Subject()
      const closeObserver = new Subject()
      const WebSocketCtor = WebSocket
      const wsSubject = webSocket({
        url,
        protocol,
        openObserver,
        closeObserver,
        WebSocketCtor: WebSocketCtor as any, // TODO: fix types don't match
      })

      // Stream of WS connected & disconnected events
      const open$ = openObserver.pipe(map((event) => connected({ event, config } as any)))
      const close$ = closeObserver.pipe(map((event) => disconnected({ event, config } as any)))

      // Close the WS connection on disconnect
      const disconnect$ = action$.pipe(
        filter(disconnect.match),
        filter(({ payload }) => payload.connectionInfo.key === connectionKey),
        tap(() => wsSubject.closed || wsSubject.complete()),
        filter(() => false), // do not duplicate events
      )

      // Multiplex subscriptions
      const subscription$ = action$.pipe(
        filter(subscribe.match),
        filter(({ payload }) => payload.connectionInfo.key === connectionKey),
        map(({ payload }) => ({ payload, subscriptionKey: payload.subscriptionInfo.key })),
        withLatestFrom(state$),
        filter(([{ subscriptionKey }, state]) => {
          // if subscription does not exist, then continues
          return !state.ws.subscriptions.active[subscriptionKey]
        }),
        // on a subscribe action being dispatched, open a new WS subscription if one doesn't exist yet
        mergeMap(([{ subscriptionKey, payload }]) => {
          // Helper function to build actions
          const _wsSubscriptionPayload = (message: any) => ({
            connectionInfo: payload.connectionInfo,
            subscriptionInfo: payload.subscriptionInfo,
            message,
            input: payload.input
          })
          // At first subscribe ws connection is established.
          // When there is no more subscribers to root Subject, socket connection closes.
          const subscribeMsg = payload.message
          let unsubscribeMsg: any = undefined
          const _setUnsubscribeMsg = ({ payload }: any) => (unsubscribeMsg = payload.message)
          return wsSubject
            .multiplex(
              () => subscribeMsg,
              () => unsubscribeMsg,
              () => true,
            )
            .pipe(
              map((message) => messageReceived(_wsSubscriptionPayload(message))),
              takeUntil(
                // unsubscribe or disconnected
                merge(
                  action$.pipe(
                    filter(unsubscribe.match),
                    filter((a) => a.payload.subscriptionInfo.key === subscriptionKey),
                    tap(_setUnsubscribeMsg),
                  ),
                  action$.pipe(
                    filter(disconnected.match),
                    filter((a) => a.payload.config.connectionInfo.key === connectionKey),
                  ),
                ),
              ),
              startWith(subscribed(_wsSubscriptionPayload(subscribeMsg))),
              endWith(unsubscribed(_wsSubscriptionPayload(unsubscribeMsg))),
            )
        }),
      )

      const messages$ = action$.pipe(
        filter(messageReceived.match),
        tap(async (action) => {
            const response = wsHandler.parse(action.payload.message)
            // Send to cache?
            const execute: Execute = () => { return Promise.resolve(wsHandler.toAdapterResponse(response)) }
            const cache = await withCache(execute)
            // TODO: Set max age to override cache
            // const input = {
            //   ...action.payload.input,
            //   data: {
            //     ...action.payload.input.data,
            //     maxAge: -1
            //   },
            //   debug: {
            //     ws: true
            //   }
            // }
            cache(action.payload.input)
        }),
        filter(() => false),
        catchError((error) => {
          console.log('Error getting message:', error)
          // TODO: Send unsubscription
          return of({ type: 'ERROR', payload: error.message })
        })
      )

      // Merge all & unsubscribe ws connection when a matching unsubscribe comes in
      const ws$ = merge(open$, close$, disconnect$, subscription$, messages$).pipe(
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

export const metricsEpic: Epic<AnyAction, AnyAction, any, any> = (action$) =>
  action$.pipe(
    tap((a) => {
      // Build connection labels
      const _connectionLabels = (p: WSConfigPayload) => ({
        key: p.config.connectionInfo.key,
        url: p.config.connectionInfo.url,
        experimental: 'true',
      })

      // Build subscription labels
      const _subscriptionLabels = (p: WSSubscriptionPayload) => ({
        connection_key: p.connectionInfo.key,
        connection_url: p.connectionInfo.url,
        subscription_key: p.subscriptionInfo.key,
        experimental: 'true',
      })

      // Match event of interest
      switch (a.type) {
        case connected.type:
          ws_connection_active.labels(_connectionLabels(a.payload)).inc()
          break
        case disconnected.type:
          ws_connection_active.labels(_connectionLabels(a.payload)).dec()
          break
        case subscribed.type:
          ws_subscription_total.labels(_subscriptionLabels(a.payload)).inc()
          ws_subscription_active.labels(_subscriptionLabels(a.payload)).inc()
          break
        case unsubscribed.type:
          ws_subscription_active.labels(_subscriptionLabels(a.payload)).dec()
          break
        case messageReceived.type:
          ws_message_total.labels(_subscriptionLabels(a.payload)).inc()
          break
      }
    }),
    filter(() => false), // do not duplicate events
  )

export const rootEpic = combineEpics(connectEpic, metricsEpic)

export const epicMiddleware = createEpicMiddleware()
