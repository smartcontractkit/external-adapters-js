import { AdapterRequest } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

export interface ParticipantPayload {
  data: AdapterRequest
}

export const newRequest = createAction<ParticipantPayload>('NEW_REQUEST')
