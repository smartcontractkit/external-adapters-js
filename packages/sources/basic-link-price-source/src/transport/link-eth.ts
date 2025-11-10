import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { formatUnits, toBigInt } from 'ethers'
import { BaseEndpointTypes } from '../endpoint/link-eth'

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

export const linkEthTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      let rpcUrl: string
      let poolAddress: string
      switch (String(param.chain).toLowerCase()) {
        case 'ethereum':
          rpcUrl = config.RPC_URL_ETHEREUM
          poolAddress = '0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8' // LINK/WETH 0.3%
          break
        case 'arbitrum':
          rpcUrl = config.RPC_URL_ARBITRUM
          poolAddress = '0x468b88941e7cc0b88c1869d68ab6b570bcef62ff' // WETH/LINK 0.3%
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
        // token0 = LINK (18), token1 = WETH (18) → scale by 10^18 to preserve precision
        priceBI = (sqrtPriceX96 ** 2n * 10n ** 18n) / Q192
      } else {
        // token0 = WETH (18), token1 = LINK (18) → inverted, scale by 10^18
        priceBI = (Q192 * 10n ** 18n) / sqrtPriceX96 ** 2n
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
