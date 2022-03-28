import { AdapterRequest } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

export interface RequestObservedPayload {
  input: AdapterRequest
}

export const requestObserved = createAction<RequestObservedPayload>(
  'BL/SUCCESSFUL_REQUEST_OBSERVED',
)

export const updateIntervals = createAction('BL/UPDATE_INTERVALS')
