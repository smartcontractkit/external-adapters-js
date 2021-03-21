export interface WSConnectionInfo {
  /** The key to identify this connection */
  key: string
  /** The url of the socket server to connect to */
  url: string
  /** The protocol to use to connect */
  protocol?: string | Array<string>
}

export interface WSSubscriptionInfo {
  /** The key to identify this subscription */
  key: string
}

export interface WSConfig {
  /** Info about the connection */
  connectionInfo: WSConnectionInfo
  /** Maximum amount of parallel connections */
  connectionLimit: number
  /** Number of ms if no data received this connection is considered dead */
  connectionTTL: number
  // TODO: exponential back-off
  /** Maximum number of connection retries */
  connectionRetryLimit: number
  /** Minimum delay between connection retries */
  connectionRetryDelay: number

  /** Maximum amount of subscriptions per connection */
  subscriptionLimit: number
  /** Number of ms if no requests for data received this subscription is considered dead */
  subscriptionTTL: number
  /** List of subscription keys that will have priority (reserved capacity) */
  subscriptionPriorityList?: Array<string>
}

export interface WSSubscriptionHandler<T> {
  /** The WS connection to use */
  connect: () => WSConnectionInfo
  /** A function to generate the subscription message to be sent to the server. */
  subscribeMsg: () => any
  /** A function to generate the unsubscription message to be sent to the server at teardown. */
  unsubscribeMsg: () => any
  /** A predicate for selecting the appropriate messages from the server for the output stream. */
  filterMsg: (value: T) => boolean
  // mapMsgToResponse: (r: AdapterRequest, msg: unknown) => AdapterResponse
}
