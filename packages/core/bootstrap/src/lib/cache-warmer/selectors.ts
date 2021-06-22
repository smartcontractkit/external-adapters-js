import { createSelector } from '@reduxjs/toolkit'
import { omit } from 'lodash'
import { RootState } from '../..'
import { WarmupExecutePayload } from './actions'
import { getSubscriptionKey } from './util'

const selectCacheWarmer = (state: RootState) => state.cacheWarmer
const selectCacheWarmerSubscriptions = createSelector(
  selectCacheWarmer,
  (state) => state.subscriptions,
)

export interface BatchWarmerSubscriptionKey {
  /**
   * If true, indicates the included key is from an existing subscription,
   * otherwise, it has been newly generated from the payload
   */
  existingKey: boolean
  key: string
}

export const selectBatchWarmerSubscriptionKey = createSelector(
  selectCacheWarmerSubscriptions,
  (_state: any, payload: WarmupExecutePayload) => payload,
  (subscriptions, payload) => {
    const batchablePropertyPath = payload.result?.debug?.batchablePropertyPath
    if (!batchablePropertyPath) {
      throw Error(`No batch key found, state invariant violated`)
    }

    const batchWarmerSubscriptionKey = getSubscriptionKey(
      omit(
        payload,
        batchablePropertyPath?.map((path) => `data.${path}`),
      ),
    )

    const batchWarmerSubscription = subscriptions[batchWarmerSubscriptionKey]

    return {
      existingKey: !!batchWarmerSubscription,
      key: batchWarmerSubscriptionKey,
    }
  },
)
