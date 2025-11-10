import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { formatUnits, toBigInt } from 'ethers'
import { BaseEndpointTypes } from '../endpoint/link-usdc'
export interface ResponseSchema {
  jsonrpc: string
  id: number
  result: string
}
export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: {
      jsonrpc: string
      method: string
      params: [{ to: string; data: string }, string]
      id: number
    }
    ResponseBody: ResponseSchema
  }
}
export const linkUsdcTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      let rpcUrl: string
      let poolAddress: string
      switch (String(param.chain).toLowerCase()) {
        case 'ethereum':
          rpcUrl = config.RPC_URL_ETHEREUM
          poolAddress = '0xfad57d2039c21811c8f2b5d5b65308aa99d31559' // LINK/USDC 0.3%
          break
        case 'arbitrum':
          rpcUrl = config.RPC_URL_ARBITRUM
          poolAddress = '0xbbe36e6f0331c6a36ab44bc8421e28e1a1871c1e' // USDC/LINK 0.3%
          break
        default:
          throw new Error(`Unsupported chain: ${param.chain}`)
      }
      return {
        params: [param],
        request: {
          baseURL: rpcUrl,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: {
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: poolAddress, data: '0x3850c7bd' }, 'latest'],
            id: 1,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    console.log(response)
    return params.map((param) => {
      if (!response.data.result) {
        return {
          params: param,
          response: {
            errorMessage: `No data from RPC for ${param.base}/${param.quote} on ${param.chain}`,
            statusCode: 502,
          },
        }
      }
      const sqrtPriceX96 = toBigInt(response.data.result.slice(0, 66))
      const Q192 = 2n ** 192n
      let priceBI: bigint
      if (String(param.chain).toLowerCase() === 'ethereum') {
        // token0 = LINK (18), token1 = USDC (6) → scale by 10^30 to preserve precision
        priceBI = (sqrtPriceX96 ** 2n * 10n ** 30n) / Q192
      } else {
        // token0 = USDC (6), token1 = LINK (18) → inverted, scale by 10^30
        priceBI = (Q192 * 10n ** 30n) / sqrtPriceX96 ** 2n
      }
      const priceNumber = Number(formatUnits(priceBI, 18))
      return {
        params: param,
        response: {
          result: priceNumber,
          data: { result: priceNumber },
        },
      }
    })
  },
})
