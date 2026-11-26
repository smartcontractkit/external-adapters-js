export const toNumber = (s?: string | number) => {
  if (s === undefined || s === null || String(s).trim() === '') return undefined
  const number = Number(s)
  if (!isFinite(number)) return undefined
  return number
}

type SubscriptionDeltas<T> = {
  desired: T[]
  new: T[]
  stale: T[]
}

/**
 * Builds the subscribe/unsubscribe messages for a WS transport from the subscription deltas.
 *
 * Subscriptions are de-duplicated by `key`, so several adapter requests that map to the same
 * upstream subscription only produce a single message. Stale subscriptions that are still
 * desired are not unsubscribed, and new subscriptions whose key is already subscribed are skipped.
 */
export const buildSubscriptionMessages = <T>(
  { desired, new: newSubscriptions, stale }: SubscriptionDeltas<T>,
  key: (params: T) => string,
  message: (params: T, action: 'subscribe' | 'unsubscribe') => Record<string, unknown>,
): Record<string, unknown>[] => {
  const desiredKeys = new Set(desired.map(key))
  const unsubscribes = [...new Map(stale.map((params) => [key(params), params]))]
    .filter(([subscriptionKey]) => !desiredKeys.has(subscriptionKey))
    .map(([, params]) => message(params, 'unsubscribe'))

  const newParams = new Set(newSubscriptions.map((params) => JSON.stringify(params)))
  const alreadySubscribedKeys = new Set(
    desired.filter((params) => !newParams.has(JSON.stringify(params))).map(key),
  )

  const subscribes = [...new Map(newSubscriptions.map((params) => [key(params), params]))]
    .filter(([subscriptionKey]) => !alreadySubscribedKeys.has(subscriptionKey))
    .map(([, params]) => message(params, 'subscribe'))

  return [...unsubscribes, ...subscribes]
}
