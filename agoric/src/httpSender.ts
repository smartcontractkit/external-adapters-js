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
  let response
  try {
    response = await axios.post(url, obj)
  } catch (e) {
    if (e.response) {
      response = e.response
    } else {
      throw e
    }
  }
  return { status: response.status, response: response.data }
}
