
export interface WSConfig {
  /** Info about the connection */
  connectionInfo: {
    key: string
  }
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
  /** Number of ms if no messages received for an active subscription, this subscription should unsubscribe or resubscribe */
  subscriptionUnresponsiveTTL: number
  /** List of subscription keys that will have priority (reserved capacity) */
  subscriptionPriorityList?: Array<string>
}

export interface WSConnectionInfo {
  key: string
  url: string
}
