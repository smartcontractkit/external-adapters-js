import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/mintable'

type ChainData = {
  error_message: string
  latest_block: number
  response_block: number
  request_block: number
  mintable: string
  token_supply: string
  token_native_mint: string
  token_ccip_mint: string
  token_ccip_burn: string
  token_pre_mint: string
  aggregate_pre_mint: boolean
}
export type IndexerResponse = {
  supply: string
  premint: string
  chains: { [chainName: string]: ChainData }
}

export const getSupply = async (
  token: string,
  supplyChains: string[],
  supplyChainBlocks: number[],
  requester: Requester,
  config: BaseEndpointTypes['Settings'],
  endpointName: string,
  transportName: string,
) => {
  const chains: Record<string, number> = {}
  for (let i = 0; i < supplyChains.length; i++) {
    chains[supplyChains[i]] = supplyChainBlocks[i]
  }

  const requestConfig = {
    method: 'post',
    baseURL: config.SECURE_MINT_INDEXER_URL,
    url: 'data',
    data: { token, chains },
  }

  const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
    context: {
      adapterSettings: config,
      inputParameters,
      endpointName,
    },
    data: requestConfig.data,
    transportName,
  })

  try {
    const response = await requester.request<IndexerResponse>(requestKey, requestConfig)
    return response?.response?.data
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `${e.message} ${JSON.stringify(e?.errorResponse) || e.name}`
    }
    throw e
  }
}
