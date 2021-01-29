import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import dnsquery from '@chainlink/dns-query-adapter'
import jsonrpc from './json-rpc/src'
import * as cryptoapisMain from './cryptoapis/src/'
const price = function (from: string, to: string): Promise<AdapterResponse> {
  // not sure about the id. maybe should not even be passed? since not involved in calls or calculation, just be appended at the ending response
  const req: AdapterRequest = { id: '0', data: { from, to } }
  // optional config could be passed? could just the API_KEY be passed? without changing the other default config.
  return cryptoapisMain.makeExecute()(req)
}
// could it be achieved with declaration merging? or by module augmentation?
const cryptoapis = { ...cryptoapisMain, price }

export { jsonrpc, dnsquery, cryptoapis }
