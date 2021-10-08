import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import { AnyAction } from 'redux'
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable'
import { concat, EMPTY, from, merge, Observable, of, race, Subject, timer } from 'rxjs'
import {
  catchError,
  concatMap,
  delay,
  endWith,
  filter,
  map,
  mergeMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators'
import { webSocket } from 'rxjs/webSocket'
import WebSocket from 'ws'
import { withCache } from '../cache'
import { censor, logger } from '../external-adapter'
import { getFeedId } from '../metrics/util'
import {
  connectFailed,
  connectFulfilled,
  connectRequested,
  disconnectFulfilled,
  disconnectRequested,
  messageReceived,
  subscribeFulfilled,
  subscribeRequested,
  subscriptionError,
  unsubscribeFulfilled,
  unsubscribeRequested,
  WSConfigPayload,
  WSErrorPayload,
  WSMessagePayload,
  WSSubscriptionErrorPayload,
  WSSubscriptionPayload,
  WSConfigOverride,
  wsSubscriptionReady,
  saveFirstMessageReceived,
  updateSubscriptionInput,
  onConnectComplete,
  subscriptionErrorHandler,
} from './actions'
import {
  ws_connection_active,
  ws_connection_errors,
  ws_message_total,
  ws_subscription_active,
  ws_subscription_errors,
  ws_subscription_total,
} from './metrics'
import { getSubsId, RootState } from './reducer'
import { separateBatches } from './utils'
import { getWSConfig } from './config'

// Rxjs deserializer defaults to JSON.parse.
// We need to handle errors from non-parsable messages
const deserializer = (message: any) => {
  try {
    return JSON.parse(message.data)
  } catch (e) {
    logger.debug('WS: Message received with invalid format')
    return message
  }
}

type ConnectRequestedActionWithState = [
  {
    payload: WSConfigOverride
    connectionKey: string
  },
  {
    ws: RootState
  },
]

export const subscribeReadyEpic: Epic<AnyAction, AnyAction, { ws: RootState }, any> = (action$) =>
  action$.pipe(
    filter(wsSubscriptionReady.match),
    concatMap(async ({ payload }) => {
      const { wsHandler, config, context, request } = payload
      const subscriptionPayloads: WSSubscriptionPayload[] = []
      await separateBatches(request, async (singleInput: AdapterRequest) => {
        const subscriptionMsg = wsHandler.onConnectChain
          ? wsHandler.onConnectChain[0].payload
          : wsHandler.subscribe(singleInput)
        if (!subscriptionMsg) {
          logger.error(`No subscription message found while seperating batches`, {
            singleInput,
            request,
          })
          return
        }
        const subscriptionPayload: WSSubscriptionPayload = {
          connectionInfo: {
            key: config.connectionInfo.key,
            url: wsHandler.connection.url,
          },
          subscriptionMsg,
          input: singleInput,
          context,
        }
        subscriptionPayloads.push(subscriptionPayload)
      })
      return subscriptionPayloads
    }),
    mergeMap(([subscriptionPayload]) => {
      const action = subscribeRequested(subscriptionPayload)
      if (!subscriptionPayload) {
        logger.debug('INVALID_SUBSCRIBE_REQUESTED_IN_READY_EPIC', action)
        return EMPTY
      }
      return of(action)
    }),
  )

export const connectEpic: Epic<AnyAction, AnyAction, { ws: RootState }, any> = (action$, state$) =>
  action$.pipe(
    filter(connectRequested.match),
    map(({ payload }) => ({ payload, connectionKey: payload.config.connectionInfo.key })),
    withLatestFrom(state$),
    filter(([{ connectionKey }, state]) => {
      const connectionState = state.ws.connections.all[connectionKey]
      const isActiveConnection = connectionState?.active
      const isConnecting = connectionState?.connecting > 1
      const hasErrored = connectionState?.shouldNotRetryConnecting
      return (
        !hasErrored &&
        !isActiveConnection &&
        !isConnecting &&
        (!connectionState || connectionState.requestId === 0)
      )
    }),
    concatMap(async (data) => {
      const getUrl = data[0].payload.wsHandler.connection.getUrl
      if (getUrl) data[0].payload.wsHandler.connection.url = await getUrl(data[0].payload.request)
      return data as ConnectRequestedActionWithState
    }),
    // on a connect action being dispatched, open a new WS connection if one doesn't exist yet
    mergeMap(([{ connectionKey, payload }]) => {
      const { config, wsHandler } = payload
      const {
        connection: { url, protocol },
      } = wsHandler
      const connectionMeta = (payload: WSConfigPayload) => ({
        key: payload.config.connectionInfo.key,
        url: censor(url),
      })
      const subscriptionMeta = (payload: WSSubscriptionPayload) => ({
        connection_key: payload.connectionInfo.key,
        connection_url: censor(url),
        feed_id: getFeedId({ ...payload.input }),
        subscription_key: getSubsId(payload.subscriptionMsg),
      })

      const openObserver = new Subject()
      const closeObserver = new Subject<CloseEvent>()
      const errorObserver = new Subject()
      const error$ = errorObserver.asObservable() as Observable<AnyAction>
      const WebSocketCtor = WebSocket
      const wsSubject = webSocket({
        url,
        protocol, // TODO: Double check this
        deserializer,
        openObserver,
        closeObserver,
        WebSocketCtor: WebSocketCtor as any, // TODO: fix types don't match
      })

      wsHandler.onConnect && wsSubject.next(wsHandler.onConnect(payload.request))

      // Stream of WS connected & disconnected events
      const open$ = openObserver.pipe(
        map(() => connectFulfilled({ config, wsHandler, connectionInfo: config.connectionInfo })),
        tap((action) => logger.info('WS: Connected', connectionMeta(action.payload))),
      )
      const close$ = closeObserver.pipe(
        withLatestFrom(state$),
        mergeMap(([closeContext, state]) => {
          const key = config.connectionInfo.key
          const activeSubs = Object.entries(state.ws.subscriptions.all)
            .filter(
              ([_, info]) => (info.active || info.subscribing > 0) && info.connectionKey === key,
            )
            .map(
              ([_, info]) =>
                ({
                  connectionInfo: {
                    url,
                    key: config.connectionInfo.key,
                  },
                  subscriptionMsg: wsHandler.subscribe(info.input),
                  input: info.input,
                } as WSSubscriptionPayload),
            )
          const toUnsubscribed = (payload: WSSubscriptionPayload) => unsubscribeFulfilled(payload)
          logger.info('Closing websocket connection', {
            context: {
              type: closeContext.type,
              wasClean: closeContext.wasClean,
              reason: closeContext.reason,
              code: closeContext.code,
            },
          })
          return from([
            ...activeSubs.map(toUnsubscribed),
            disconnectFulfilled({
              config,
              wsHandler,
            }),
          ])
        }),
      )

      // Close the WS connection on disconnect
      const disconnect$ = action$.pipe(
        filter(disconnectRequested.match),
        filter(({ payload }) => payload.config.connectionInfo.key === connectionKey),
        tap(() => wsSubject.closed || wsSubject.complete()),
        tap((action) => logger.info('WS: Disconnected', connectionMeta(action.payload))),
        filter(() => false), // do not duplicate events
      )

      // Subscription requests
      const subscriptions$ = action$.pipe(filter(subscribeRequested.match))

      const updateSubscriptionInput$ = subscriptions$.pipe(
        filter(({ payload }) => payload.connectionInfo.key === connectionKey),
        map(({ payload }) => ({
          payload,
          subscriptionKey: getSubsId(payload.subscriptionMsg),
        })),
        withLatestFrom(state$),
        filter(([{ subscriptionKey, payload }, state]) => {
          const isActiveSubscription = !!state.ws.subscriptions.all[subscriptionKey]?.active
          const isSubscribing = state.ws.subscriptions.all[subscriptionKey]?.subscribing > 1
          if (!isActiveSubscription || isSubscribing) {
            return false
          }
          const currentInput = state.ws.subscriptions.all[subscriptionKey]?.input
          return getSubsId(currentInput) !== getSubsId(payload.input)
        }),
        mergeMap(async ([{ subscriptionKey, payload }]) => {
          return updateSubscriptionInput({
            subscriptionKey,
            input: payload.input,
          })
        }),
      )

      // Multiplex subscriptions
      const multiplexSubscriptions$ = subscriptions$.pipe(
        filter(({ payload }) => payload.connectionInfo.key === connectionKey),
        map(({ payload }) => ({
          payload,
          subscriptionKey: getSubsId(payload.subscriptionMsg),
        })),
        withLatestFrom(state$),
        filter(([{ subscriptionKey, payload }, state]) => {
          const isActiveSubscription = !!state.ws.subscriptions.all[subscriptionKey]?.active
          const isSubscribing = state.ws.subscriptions.all[subscriptionKey]?.subscribing > 1
          const shouldNotRetrySubscribing =
            state.ws.subscriptions.all[subscriptionKey]?.shouldNotRetry
          const isNotActive = !isActiveSubscription && !isSubscribing
          const { isDataMessage, onConnectChain } = wsHandler
          if (isDataMessage && onConnectChain && isDataMessage(payload.subscriptionMsg)) {
            const connectionState = state.ws.connections.all[payload.connectionInfo.key]
            const hasOnConnectChainCompleted = connectionState.requestId >= onConnectChain.length
            return !shouldNotRetrySubscribing && isNotActive && hasOnConnectChainCompleted
          }
          return !shouldNotRetrySubscribing && isNotActive
        }),
        // on a subscribe action being dispatched, open a new WS subscription if one doesn't exist yet
        mergeMap(([{ subscriptionKey, payload }, state]) =>
          wsSubject
            .multiplex(
              () => {
                const clonedPayload = JSON.parse(JSON.stringify(payload.subscriptionMsg))
                const shouldModifyPayload =
                  !!wsHandler.shouldModifyPayload &&
                  wsHandler.shouldModifyPayload(clonedPayload) &&
                  wsHandler.modifySubscriptionPayload
                const connectionState = state.ws.connections.all[payload.connectionInfo.key]
                const subMsg =
                  shouldModifyPayload && wsHandler.modifySubscriptionPayload
                    ? wsHandler.modifySubscriptionPayload(
                        clonedPayload,
                        state.ws.subscriptions.all[subscriptionKey]?.subscriptionParams,
                        connectionState.connectionParams,
                        connectionState.requestId,
                      )
                    : clonedPayload
                return subMsg
              },
              () =>
                wsHandler.unsubscribe(
                  payload.input,
                  state.ws.subscriptions.all[subscriptionKey]?.subscriptionParams,
                ),
              (message) => {
                const connectionState = state.ws.connections.all[payload.connectionInfo.key]
                const shouldPassAlong =
                  (payload.filterMultiplex && payload.filterMultiplex(message)) ||
                  getSubsId(
                    wsHandler.subsFromMessage(
                      message,
                      payload.subscriptionMsg,
                      payload.input,
                      connectionState?.connectionParams,
                    ),
                  ) === subscriptionKey
                if (!shouldPassAlong) {
                  return false
                }
                /**
                 * If the error happens on the subscription, it will be on subscribing state and eventually unresponsiveTimeout will take care of it (unsubs/subs)
                 * If the error happens during a subscription, and is only eventual, can be ignored
                 * If the error happens during a subscription, and the subscription stop receiving messages, the unresponsiveTimeout will take care of it (unsubs/subs)
                 */
                if (wsHandler.isError(message)) {
                  const error = {
                    reason: JSON.stringify(message),
                    connectionInfo: { key: connectionKey, url },
                    error: message,
                  }
                  logger.error('WS: Error', error)
                  errorObserver.next(
                    subscriptionError({
                      ...error,
                      wsHandler,
                    }),
                  )
                  return false
                }
                return true
              },
            )
            .pipe(
              withLatestFrom(state$),
              mergeMap(([message, state]) => {
                const isActiveSubscription = !!state.ws.subscriptions.all[subscriptionKey]?.active
                const actionPayload = {
                  message,
                  subscriptionKey,
                  input: payload.input,
                  context: payload.context,
                  connectionInfo: payload.connectionInfo,
                  wsHandler,
                }
                if (!isActiveSubscription) {
                  logger.info('WS: Subscribed', subscriptionMeta(payload))
                  return of(subscribeFulfilled(payload), messageReceived(actionPayload))
                }
                return of(messageReceived(actionPayload))
              }),
              takeUntil(
                merge(
                  action$.pipe(
                    filter(unsubscribeRequested.match),
                    filter((a) => getSubsId(a.payload.subscriptionMsg) === subscriptionKey),
                    tap((a) => logger.info('WS: Unsubscribed', subscriptionMeta(a.payload))),
                  ),
                  action$.pipe(
                    filter(disconnectFulfilled.match),
                    filter((a) => a.payload.config.connectionInfo.key === connectionKey),
                  ),
                ),
              ),
              endWith(unsubscribeFulfilled(payload)),
            ),
        ),
        catchError((e) => {
          logger.error(e)
          return of(
            connectFailed({ connectionInfo: { key: connectionKey, url }, reason: e.message }),
          )
        }),
      )

      const withHeartbeatAtIntervals$ = action$.pipe(
        filter((action) => {
          return connectFulfilled.match(action) && !!wsHandler.heartbeatMessage
        }),
        withLatestFrom(state$),
        filter(([action, state]) => {
          const connectionKey = action.payload.connectionInfo.key
          const connectionState = state.ws.connections.all[connectionKey]
          return !!connectionState && connectionState.active
        }),
        mergeMap(([action, state]) => {
          const connectionKey = action.payload.connectionInfo.key
          const connectionState = state.ws.connections.all[connectionKey]
          const interval = wsHandler.heartbeatIntervalInMS || config.defaultHeartbeatIntervalInMS
          return timer(interval, interval).pipe(
            tap(() => logger.debug('Sending heartbeat message')),
            mergeMap(() => {
              if (wsHandler.heartbeatMessage) {
                const heartbeatPayload = wsHandler.heartbeatMessage(
                  connectionState.requestId,
                  connectionState.connectionParams,
                )
                wsSubject.next(heartbeatPayload)
              }
              return EMPTY
            }),
            takeUntil(
              action$.pipe(
                filter(disconnectFulfilled.match),
                filter((action) => action.payload.config.connectionInfo.key === connectionKey),
              ),
            ),
          )
        }),
      )

      // All received messages using the same connection key
      const message$ = action$.pipe(
        filter(messageReceived.match),
        filter((action) => action.payload.connectionInfo.key === connectionKey),
      )

      const withContinueOnConnectChain$ = message$.pipe(
        withLatestFrom(state$),
        filter(([action, state]) => {
          const key = action.payload.connectionInfo.key
          const connectionState = state.ws.connections.all[key]
          return (
            !!connectionState &&
            !!wsHandler.onConnectChain &&
            connectionState.requestId <= wsHandler.onConnectChain.length
          )
        }),
        mergeMap(([{ payload }, state]) => {
          const { input, context, message } = payload
          const onConnectIdx = state.ws.connections.all[payload.connectionInfo.key]
            ? state.ws.connections.all[payload.connectionInfo.key].requestId
            : 0
          if (!wsHandler.onConnectChain || onConnectIdx === undefined) {
            return EMPTY
          }
          const onConnectChainFinished = onConnectIdx >= wsHandler.onConnectChain.length
          const subscriptionMsg = onConnectChainFinished
            ? wsHandler.subscribe(input)
            : wsHandler.onConnectChain[onConnectIdx].payload
          const subscriptionPayload: WSSubscriptionPayload = {
            connectionInfo: {
              key: config.connectionInfo.key,
              url: wsHandler.connection.url,
            },
            subscriptionMsg,
            input,
            context,
            messageToSave:
              wsHandler.shouldSaveToConnection &&
              wsHandler.shouldSaveToConnection(message) &&
              wsHandler.saveOnConnectToConnection
                ? wsHandler.saveOnConnectToConnection(message)
                : null,
            filterMultiplex: onConnectChainFinished
              ? undefined
              : wsHandler.onConnectChain[onConnectIdx].filter,
            shouldNeverUnsubscribe: onConnectChainFinished
              ? false
              : wsHandler.onConnectChain[onConnectIdx].shouldNeverUnsubscribe,
          }
          const subscribeRequestedAction = subscribeRequested(subscriptionPayload)
          if (onConnectChainFinished) {
            return of(subscribeRequestedAction, onConnectComplete(subscriptionPayload))
          }
          return of(subscribeRequestedAction)
        }),
      )

      const withSaveFirstMessageToStore$ = message$.pipe(
        filter(() => {
          return !!wsHandler.toSaveFromFirstMessage
        }),
        withLatestFrom(state$),
        filter(([action, state]) => {
          const key = action.payload.subscriptionKey
          const subscription = state.ws.subscriptions.all[key]
          return subscription && !subscription.subscriptionParams
        }),
        mergeMap(([action]) => {
          const toSave =
            wsHandler.toSaveFromFirstMessage &&
            wsHandler.toSaveFromFirstMessage(action.payload.message)
          return toSave
            ? of(
                saveFirstMessageReceived({
                  subscriptionKey: action.payload.subscriptionKey,
                  message: toSave,
                }),
              )
            : EMPTY
        }),
      )

      const respondWithHeartbeat$ = message$.pipe(
        filter(
          (action) =>
            !!wsHandler.shouldReplyToServerHeartbeat &&
            wsHandler.shouldReplyToServerHeartbeat(action.payload.message),
        ),
        withLatestFrom(state$),
        mergeMap(([action, state]) => {
          const { connectionInfo, message } = action.payload
          const key = connectionInfo.key
          const { requestId, connectionParams } = state.ws.connections.all[key]
          if (wsHandler.heartbeatReplyMessage) {
            const heartbeatMessage = wsHandler.heartbeatReplyMessage(
              message,
              requestId,
              connectionParams,
            )
            logger.debug('Responding with heartbeat payload', heartbeatMessage)
            wsSubject.next(heartbeatMessage)
          }
          return of(action)
        }),
        filter(() => false),
      )

      // Once a request happens, a subscription timeout starts. If no more requests ask for
      // this subscription before the time runs out, it will be unsubscribed
      const unsubscribeOnTimeout$ = subscriptions$.pipe(
        filter((action) => !action.payload.shouldNeverUnsubscribe),
        // when a subscription comes in
        // TODO: we need to filter duplicated subscriptions here
        mergeMap(({ payload }) => {
          const subscriptionKey = getSubsId(payload.subscriptionMsg)
          // we look for matching subscriptions of the same type
          // which deactivates the current timer
          const reset$ = subscriptions$.pipe(
            filter(({ payload }) => subscriptionKey === getSubsId(payload.subscriptionMsg)),
            take(1),
          )
          // start the current unsubscription timer
          const timeout$ = of(unsubscribeRequested({ ...payload })).pipe(
            delay(config.subscriptionTTL),
            tap(() =>
              logger.debug('WS: unsubscribe (inactive feed)', { payload: payload.subscriptionMsg }),
            ),
          )
          // if a re-subscription comes in before timeout emits, then we emit nothing
          // else we unsubscribe from the current subscription
          return race(reset$, timeout$).pipe(filter((a) => !subscribeRequested.match(a)))
        }),
      )

      const unsubscribeOnNoResponse$ = message$.pipe(
        withLatestFrom(state$),
        mergeMap(
          ([
            {
              payload: { subscriptionKey },
            },
            state,
          ]) => {
            let input = state.ws.subscriptions.all[subscriptionKey]?.input
            if (!input) {
              logger.warn(`WS: Could not find subscription from incoming message`)
              input = {} as AdapterRequest
            }

            const reset$ = message$.pipe(
              filter(({ payload }) => subscriptionKey === payload.subscriptionKey),
              take(1),
            )

            let context = state.ws.subscriptions.all[subscriptionKey]?.context
            if (!context) {
              logger.warn(`WS Unsubscribe No Response: Could not find context`)
              context = {}
            }

            const action = {
              input,
              subscriptionMsg: wsHandler.subscribe(input),
              connectionInfo: { key: connectionKey, url },
              context,
            }

            const subReqAction = subscribeRequested(action)

            const timeout$ = of(
              subscriptionError({
                ...action,
                reason: 'WS: unsubscribe -> subscribe (unresponsive channel)',
                wsHandler,
              }),
              unsubscribeRequested(action),
              subReqAction,
            ).pipe(
              delay(config.subscriptionUnresponsiveTTL),
              tap((a) => {
                if (subscriptionError.match(a)) {
                  logger.warn(
                    '[unsubscribeOnNoResponse] Resubscribing due to unresponsive subscription, this happens when a subscription does not receive a message for longer than the subscriptionUnresponsiveTTL value',
                    { feedId: a.payload.input ? getFeedId(a.payload.input) : 'undefined' },
                  )
                }
              }),
              withLatestFrom(state$),
              // Filters by active subscription.
              // The timeout could think we don't receive messages because of unresponsiveness, and it's actually unsubscribed
              // isSubscribing is considered too as we want to trigger an unsubscription from a hung channel
              mergeMap(([action, state]) => {
                const isActive = !!state.ws.subscriptions.all[subscriptionKey]?.active
                const isSubscribing = !!(
                  state.ws.subscriptions.all[subscriptionKey]?.subscribing > 0
                )
                return isActive || isSubscribing ? of(action) : EMPTY
              }),
            )

            return race(reset$, timeout$).pipe(filter((a) => !messageReceived.match(a)))
          },
        ),
      )

      // Merge all & unsubscribe ws connection when a matching unsubscribe comes in
      const unsubscribe$ = merge(unsubscribeOnTimeout$, unsubscribeOnNoResponse$)
      const ws$ = merge(
        open$,
        close$,
        disconnect$,
        multiplexSubscriptions$,
        unsubscribe$,
        withSaveFirstMessageToStore$,
        updateSubscriptionInput$,
        withContinueOnConnectChain$,
        withHeartbeatAtIntervals$,
        error$,
        respondWithHeartbeat$,
      ).pipe(
        takeUntil(
          action$.pipe(
            // TODO: not seeing unsubscribe events because of this
            filter(disconnectFulfilled.match),
            filter((a) => a.payload.config.connectionInfo.key === connectionKey),
            tap((action) => {
              logger.debug('WS: Disconnected Fulfilled', connectionMeta(action.payload))
            }),
          ),
        ),
      )
      return concat(of(wsSubscriptionReady(payload)), ws$)
    }),
  )

export const recordErrorEpic: Epic<AnyAction, AnyAction, { ws: RootState }, any> = (action$) =>
  action$.pipe(
    filter((action) => subscriptionError.match(action) && !!action.payload.error),
    mergeMap(({ payload }) => {
      const { wsHandler, error, connectionInfo, subscriptionMsg } = payload
      const { shouldNotRetryConnection, shouldNotRetrySubscription } = wsHandler
      return of(
        subscriptionErrorHandler({
          connectionInfo,
          subscriptionMsg,
          shouldNotRetryConnection: !!shouldNotRetryConnection && shouldNotRetryConnection(error),
          shouldNotRetrySubscription:
            !!shouldNotRetrySubscription && shouldNotRetrySubscription(error),
        }),
      )
    }),
  )

export const writeMessageToCacheEpic: Epic<AnyAction, AnyAction, { ws: RootState }, any> = (
  action$,
  state$,
) =>
  action$.pipe(
    filter(messageReceived.match),
    filter((action) => action.payload.wsHandler.filter(action.payload.message)),
    withLatestFrom(state$),
    mergeMap(async ([action, state]) => {
      const wsHandler = action.payload.wsHandler
      try {
        const subscriptionState = state.ws.subscriptions.all[action.payload.subscriptionKey]
        const input = subscriptionState?.input || {}

        if (!input) logger.warn(`WS: Could not find subscription from incoming message`)

        /**
         * Wrap the payload so that the cache middleware treats it as if
         * it is calling out to the underlying API, which immediately resolves
         * to the websocket message here instead.
         *
         * This results in the cache middleware storing the payload message as a
         * cache value, with the following `wsResponse` as the cache key
         */
        const isToResponseAsync = wsHandler.toResponse.constructor.name === 'AsyncFunction'
        const response = isToResponseAsync
          ? await wsHandler.toResponse(action.payload.message, input)
          : (wsHandler.toResponse(action.payload.message, input) as AdapterResponse)
        if (!response) return action
        const execute: Execute = () => Promise.resolve(response)
        let context = subscriptionState?.context
        if (!context) {
          logger.warn(`WS Unsubscribe No Response: Could not find context`)
          context = {}
        }

        const cache = await withCache()(execute, context)
        const wsConfig = getWSConfig(input.data?.endpoint)

        /**
         * Create an adapter request we send to the cache middleware
         * so it uses the following object for setting cache keys
         */
        const wsResponse: AdapterRequest = {
          ...input,
          data: { maxAge: wsConfig.subscriptionTTL, ...input.data },
          debug: { ws: true },
          metricsMeta: { feedId: getFeedId(input) },
        }
        await cache(wsResponse, context)
        logger.trace('WS: Saved result', { input, result: response.result })
      } catch (e) {
        logger.error(`WS: Cache error: ${e.message}`)
      }
      return action
    }),
    filter(() => false),
  )

export const metricsEpic: Epic<AnyAction, AnyAction, any, any> = (action$, state$) =>
  action$.pipe(
    withLatestFrom(state$),
    tap(([action, state]) => {
      const connectionLabels = (payload: WSConfigPayload) => ({
        key: payload.config.connectionInfo.key,
      })
      const connectionErrorLabels = (payload: WSErrorPayload) => ({
        key: payload.connectionInfo.key,
        message: payload.reason,
      })
      const subscriptionLabels = (payload: WSSubscriptionPayload) => ({
        connection_key: payload.connectionInfo.key,
        feed_id: getFeedId({ ...payload.input }),
        subscription_key: getSubsId(payload.subscriptionMsg),
      })
      const subscriptionErrorLabels = (payload: WSSubscriptionErrorPayload) => ({
        connection_key: payload.connectionInfo.key,
        feed_id: payload.input ? getFeedId({ ...payload.input }) : 'N/A',
        message: payload.reason,
        subscription_key: payload.subscriptionMsg ? getSubsId(payload.subscriptionMsg) : 'N/A',
      })
      const messageLabels = (payload: WSMessagePayload) => ({
        feed_id: getFeedId({
          ...state.ws.subscriptions.all[action.payload.subscriptionKey]?.input,
        }),
        subscription_key: payload.subscriptionKey,
      })

      switch (action.type) {
        case connectFulfilled.type:
          ws_connection_active.labels(connectionLabels(action.payload)).inc()
          break
        case connectFailed.type:
          ws_connection_errors.labels(connectionErrorLabels(action.payload)).inc()
          break
        case disconnectFulfilled.type:
          if (state.ws.connections.all[connectionLabels(action.payload).key]?.wasEverConnected) {
            ws_connection_active.labels(connectionLabels(action.payload)).dec()
          }
          break
        case subscribeFulfilled.type:
          ws_subscription_total.labels(subscriptionLabels(action.payload)).inc()
          ws_subscription_active.labels(subscriptionLabels(action.payload)).inc()
          break
        case subscriptionError.type:
          ws_subscription_errors.labels(subscriptionErrorLabels(action.payload)).inc()
          break
        case unsubscribeFulfilled.type: {
          if (
            state.ws.subscriptions.all[getSubsId(action.payload.subscriptionMsg)]?.wasEverActive
          ) {
            ws_subscription_active.labels(subscriptionLabels(action.payload)).dec()
          }
          break
        }
        case messageReceived.type:
          ws_message_total.labels(messageLabels(action.payload)).inc()
          break
      }
    }),
    map(([action]) => action),
    filter(() => false), // do not duplicate events
  )

export const rootEpic = combineEpics(
  connectEpic,
  metricsEpic,
  subscribeReadyEpic,
  writeMessageToCacheEpic,
  recordErrorEpic,
)

export const epicMiddleware = createEpicMiddleware()
