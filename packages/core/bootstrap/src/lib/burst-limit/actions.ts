import { AdapterRequest } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

export interface RequestObservedPayload {
  input: AdapterRequest
}

export const requestObserved = createAction<RequestObservedPayload>(
  'RL/SUCCESSFUL_REQUEST_OBSERVED',
)
