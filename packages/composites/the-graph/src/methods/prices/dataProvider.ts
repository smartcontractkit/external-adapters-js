import * as graphqlAdapter from "@chainlink/graphql-adapter"
import { GraphqlAdapterRequest, TokenInformation } from "../../types"
import { AdapterResponse, AdapterRequest } from "@chainlink/types"
import { getPairQuery, getTokenQuery } from "../../graphqlQueries"
import { UNISWAP_V2_GRAPH_ENDPOINT } from "../../config"

export const getToken = async (jobRunID: string, symbol: string): Promise<TokenInformation> => {
    const data: GraphqlAdapterRequest = {
        query: getTokenQuery,
        variables: {
            symbol
        },
        graphqlEndpoint: UNISWAP_V2_GRAPH_ENDPOINT
    }
    const response = await fetchFromGraphqlAdapter(jobRunID, data)
    const tokens = response.result.data.tokens
    if (tokens.length !== 1) {
        throw new Error()
    }
    const token = tokens[0]
    return {
        id: token.id as string,
        decimals: token.decimals as number
    }
}

// Returns price as token1/token0
export const getTokenPairPrice = async (jobRunID: string, token0Address: string, token1Address: string): Promise<number | null> => {
    const req1Data: GraphqlAdapterRequest = {
        query: getPairQuery,
        variables: {
            "token0ID": token0Address,
            "token1ID": token1Address
        },
        graphqlEndpoint: UNISWAP_V2_GRAPH_ENDPOINT
    }
    const req1Response = await fetchFromGraphqlAdapter(jobRunID, req1Data)
    const req1Pairs = req1Response.result.data.pairs
    if (req1Pairs.length > 0) {
        const highestVolumePair = req1Pairs[0]
        return highestVolumePair["token1Price"]
    }

    // Try reverse token0 and token1
    const req2Data: GraphqlAdapterRequest = {
        query: getPairQuery,
        variables: {
            "token0ID": token1Address,
            "token1ID": token0Address
        },
        graphqlEndpoint: UNISWAP_V2_GRAPH_ENDPOINT
    }

    const req2Response = await fetchFromGraphqlAdapter(jobRunID, req2Data)
    const req2Pairs = req2Response.result.data.pairs
    if (req2Pairs.length > 0) {
        const highestVolumePair = req2Pairs[0]
        return highestVolumePair["token0Price"]
    }
    return null
}

const fetchFromGraphqlAdapter = async (jobRunID: string, data: GraphqlAdapterRequest): Promise<AdapterResponse> => {
    const graphqlExecute = graphqlAdapter.makeExecute()
    const request: AdapterRequest = {
        data: {
            ...data
        },
        id: jobRunID
    }
    return await graphqlExecute(request)
}