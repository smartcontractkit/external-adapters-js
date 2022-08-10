import { AxiosResponse } from '@chainlink/ea-bootstrap'

export const getMockAxiosResponse = (response: unknown): AxiosResponse => ({
  status: 204,
  statusText: 'success',
  headers: {},
  config: {},
  data: response,
})
