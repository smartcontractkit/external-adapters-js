import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'

export type PriceAdapter = (input: AdapterRequest) => Promise<any>

export const getDataProvider = (apiConfig: any): PriceAdapter => async (input) =>
  Requester.request({ ...apiConfig, data: input })
