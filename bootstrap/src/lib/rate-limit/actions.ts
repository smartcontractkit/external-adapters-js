import { createAction } from '@reduxjs/toolkit'
import { ActionBase, toActionPayload } from '../store'

const DEFAULT_COST = 1

export interface RequestObservedPayload extends ActionBase {
  typeId: string
  cost: number
}

export const requestObserved = createAction(
  'RL/REQUEST_OBSERVED',
  (typeId: string, cost = DEFAULT_COST) => ({
    payload: toActionPayload({ typeId, cost }),
  }),
)
