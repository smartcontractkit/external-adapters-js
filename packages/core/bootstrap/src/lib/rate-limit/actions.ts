import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'
import { ActionBase, toActionPayload } from '../store'

export interface SuccessfulRequestObservedPayload extends ActionBase {
  input: AdapterRequest
  response: AdapterResponse
}

export const successfulResponseObserved = createAction(
  'RL/SUCCESSFUL_RESPONSE_OBSERVED',
  (input: AdapterRequest, response: AdapterResponse) => ({
    payload: toActionPayload({ input, response }) as SuccessfulRequestObservedPayload,
  }),
)
