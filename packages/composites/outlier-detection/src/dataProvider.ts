import { Requester } from '@chainlink/external-adapter'
import { AdapterRequest, AdapterResponse, AxiosRequestConfig } from '@chainlink/types'

export type PriceAdapter = (input: AdapterRequest) => Promise<AdapterResponse>

export const getDataProvider = (apiConfig: AxiosRequestConfig): PriceAdapter => async (input) =>
  Requester.request({ ...apiConfig, data: input })
