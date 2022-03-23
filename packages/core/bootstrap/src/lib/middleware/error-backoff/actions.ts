import { AdapterRequest } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

export interface RequestObservedPayload {
  input: AdapterRequest
}

export const requestFailedObserved = createAction<RequestObservedPayload>(
  'EB/FAILED_REQUEST_OBSERVED',
)

export const requestObserved = createAction('EB/REQUEST_OBSERVED')

export const shutdown = createAction('EB/SHUTDOWN')
