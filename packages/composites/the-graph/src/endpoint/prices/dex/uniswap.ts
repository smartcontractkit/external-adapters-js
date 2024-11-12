import {
  AdapterDataProviderError,
  AdapterError,
  AdapterResponseEmptyError,
  AdapterResponseInvalidError,
} from '@chainlink/ea-bootstrap'
import { DexSubgraph, GraphqlAdapterRequest, TokenInformation } from '../../../types'
import { fetchFromGraphqlAdapter } from '../dataProvider'
import { getPairQuery, getTokenQuery } from './graphqlQueries'

type TokenResponseSchema = {
  result: {
    tokens: TokenInformation[]
    error?: AdapterError
  }
}

type TokenPairResponseSchema = {
  result: {
    pairs: { token0Price: number; token1Price: number }[]
  }
}

export class UniswapSubgraph implements DexSubgraph {
  private url: string

  constructor(url: string) {
    this.url = url
  }

  async getToken(jobRunID: string, symbol: string): Promise<TokenInformation> {
    const data: GraphqlAdapterRequest = {
      query: getTokenQuery,
      variables: {
        symbol,
      },
      graphqlEndpoint: this.url,
    }
    const response = await fetchFromGraphqlAdapter<TokenResponseSchema>(jobRunID, data)
    if (!response.data.result) {
      throw response.data.result.error
        ? new AdapterDataProviderError(response.data.result.error)
        : new AdapterResponseEmptyError({ message: 'Failed to get token information' })
    }
    const tokens = response.data.result.tokens
    if (tokens.length !== 1) {
      throw new AdapterResponseInvalidError({ message: `Token ${symbol} not found` })
    }
    const token = tokens[0]
    return {
      id: token.id,
      decimals: token.decimals,
    }
  }

  async getTokenPairPrice(
    jobRunID: string,
    token0Address: string,
    token1Address: string,
  ): Promise<number | null> {
    const req1Data: GraphqlAdapterRequest = {
      query: getPairQuery,
      variables: {
        token0ID: token0Address,
        token1ID: token1Address,
      },
      graphqlEndpoint: this.url,
    }
    const req1Response = await fetchFromGraphqlAdapter<TokenPairResponseSchema>(jobRunID, req1Data)
    const req1Pairs = req1Response.data.result.pairs
    if (req1Pairs.length > 0) {
      const highestVolumePair = req1Pairs[0]
      return highestVolumePair['token1Price']
    }

    // Try reverse token0 and token1
    const req2Data: GraphqlAdapterRequest = {
      query: getPairQuery,
      variables: {
        token0ID: token1Address,
        token1ID: token0Address,
      },
      graphqlEndpoint: this.url,
    }

    const req2Response = await fetchFromGraphqlAdapter<TokenPairResponseSchema>(jobRunID, req2Data)
    const req2Pairs = req2Response.data.result.pairs
    if (req2Pairs.length > 0) {
      const highestVolumePair = req2Pairs[0]
      return highestVolumePair['token0Price']
    }
    return null
  }
}
