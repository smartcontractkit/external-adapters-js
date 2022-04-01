import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AxiosResponse, AxiosRequestConfig } from '@chainlink/ea-bootstrap'

export type PriceAdapter = (input: AdapterRequest) => Promise<AxiosResponse>

export const getDataProvider =
  (apiConfig: AxiosRequestConfig): PriceAdapter =>
  async (input) =>
    Requester.request({ ...apiConfig, data: input })
