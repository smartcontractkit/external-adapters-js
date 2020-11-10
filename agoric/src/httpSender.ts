import axios from 'axios'

export interface Action {
  type: string
  data: unknown
}
export interface HTTPSenderReply {
  status: number
  response: unknown
}
export type HTTPSender = (obj: Action) => Promise<HTTPSenderReply>

export const makeHTTPSender: (url: string) => HTTPSender = (url) => async (obj) => {
  const response = await axios.post(url, obj)
  return { status: response.status, response: response.data }
}
