import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AxiosResponse, RequestConfig } from '@chainlink/ea-bootstrap'

export type PriceAdapter = (input: AdapterRequest) => Promise<AxiosResponse>

export const getDataProvider =
  (apiConfig: RequestConfig): PriceAdapter =>
  async (input) =>
    Requester.request({ ...apiConfig, data: input })
