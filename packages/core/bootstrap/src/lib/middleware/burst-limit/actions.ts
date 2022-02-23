import type { AdapterRequest } from '../../../types'
import { createAction } from '@reduxjs/toolkit'

export interface RequestObservedPayload {
  input: AdapterRequest
}

export const requestObserved = createAction<RequestObservedPayload>(
  'RL/SUCCESSFUL_REQUEST_OBSERVED',
)
