// import { Requester, Validator } from '@chainlink/external-adapter'
import JSONRPC from '@chainlink/json-rpc-adapter'
import { Execute } from '@chainlink/types'

// const inputParams = {
//   url: false,
//   method: false,
//   params: false,
// }

// Export function to integrate with Chainlink node
export const execute: Execute = async (request: any) => {
  return JSONRPC.execute(request)
}
