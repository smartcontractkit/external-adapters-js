import type { AdapterRequest } from '../../../types'
import { createAction } from '@reduxjs/toolkit'

export interface RequestObservedPayload {
  input: AdapterRequest
}

export const initialRequestObserved = createAction('BL/INITIAL_REQUEST_OBSERVED')

export const requestObserved = createAction<RequestObservedPayload>(
  'BL/SUCCESSFUL_REQUEST_OBSERVED',
)

export const updateIntervals = createAction('BL/UPDATE_INTERVALS')
