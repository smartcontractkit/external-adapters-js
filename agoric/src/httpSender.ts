import { Requester } from '@chainlink/external-adapter'

export interface Action {
  type: string
  data: unknown
}
export interface HTTPSenderReply {
  status: number
  response: unknown
}
export type HTTPSender = (obj: Action) => Promise<HTTPSenderReply>

export const makeHTTPSender = (url: string): HTTPSender => async (data) => {
  const response = await Requester.request({ method: 'POST', url, data, validateStatus: null })
  return { status: response.status, response: response.data }
}
