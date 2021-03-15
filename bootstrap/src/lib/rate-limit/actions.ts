import { AdapterRequest } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'
import { ActionBase, toActionPayload } from '../store'

const DEFAULT_COST = 1

export interface SuccessfulRequestObservedPayload extends ActionBase {
  typeId: string
  cost: number
}

export interface RequestObservedPayload extends ActionBase {
  typeId: string
  data: AdapterRequest
}

export interface ResponseObservedPayload extends ActionBase {
  typeId: string
  data: any
  success: boolean
  cached: boolean
  rlMaxAge: number
  latency: number[]
  cost: number
  maxAgeSet?: number
  ttl?: number
}

export const successfulRequestObserved = createAction(
  'RL/SUCCESSFUL_REQUEST_OBSERVED',
  (typeId: string, cost = DEFAULT_COST) => ({
    payload: toActionPayload({ typeId, cost }) as SuccessfulRequestObservedPayload,
  }),
)

export const requestObserved = createAction(
  'RL/REQUEST_OBSERVED',
  (typeId: string, data: AdapterRequest) => ({
    payload: toActionPayload({ typeId, data }) as RequestObservedPayload,
  }),
)

export const responseObserved = createAction(
  'RL/RESPONSE_OBSERVED',
  (
    typeId: string,
    data: any,
    success: boolean,
    rlMaxAge: number,
    latency: number[],
    cost = 1,
    cache?: { maxAgeSet: number; ttl: number },
  ) => ({
    payload: toActionPayload({
      typeId,
      data,
      success,
      rlMaxAge,
      latency,
      cost,
      cached: !!cache,
      maxAgeSet: cache?.maxAgeSet,
      ttl: cache?.ttl,
    }) as ResponseObservedPayload,
  }),
)
