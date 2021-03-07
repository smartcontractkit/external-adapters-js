import { AdapterRequest } from '@chainlink/types'
import { createAction, nanoid } from '@reduxjs/toolkit'
import { getParticipantId } from './util'

const DEFAULT_COST = 1

const toActionPayload = <A extends ActionBase>(data: any): A => ({
  id: nanoid(),
  createdAt: new Date().toISOString(),
  ...data,
})

export interface ActionBase {
  id: string
  createdAt: string
}

export interface RequestObservedPayload extends ActionBase {
  requestId: string
  cost: number
}

export const requestObserved = createAction(
  'RL/REQUEST_OBSERVED',
  (input: AdapterRequest, cost = DEFAULT_COST) => ({
    payload: toActionPayload({ requestId: getParticipantId(input), cost }),
  }),
)
