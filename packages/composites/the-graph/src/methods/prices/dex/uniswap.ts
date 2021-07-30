import { DexSubgraph, GraphqlAdapterRequest, TokenInformation } from "../../../types"
import { fetchFromGraphqlAdapter } from "../dataProvider"
import { getPairQuery, getTokenQuery } from "./graphqlQueries"

export class UniswapSubgraph implements DexSubgraph {
    private url: string 

    constructor(url: string) {
        this.url = url 
    }

    async getToken(jobRunID: string, symbol: string): Promise<TokenInformation> {
        const data: GraphqlAdapterRequest = {
            query: getTokenQuery,
            variables: {
                symbol
            },
            graphqlEndpoint: this.url
        }
        const response = await fetchFromGraphqlAdapter(jobRunID, data)
        if(!response.result.data) {
            const error = response.result.error || "Failed to get token information"
            throw new Error(error )
        }
        const tokens = response.result.data.tokens
        if (tokens.length !== 1) {
            throw new Error(`Token ${symbol} not found`)
        }
        const token = tokens[0]
        return {
            id: token.id as string,
            decimals: token.decimals as number
        }
    }

    async getTokenPairPrice(jobRunID: string, token0Address: string, token1Address: string): Promise<number | null> {
        const req1Data: GraphqlAdapterRequest = {
            query: getPairQuery,
            variables: {
                "token0ID": token0Address,
                "token1ID": token1Address
            },
            graphqlEndpoint: this.url
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
            graphqlEndpoint: this.url
        }
    
        const req2Response = await fetchFromGraphqlAdapter(jobRunID, req2Data)
        const req2Pairs = req2Response.result.data.pairs
        if (req2Pairs.length > 0) {
            const highestVolumePair = req2Pairs[0]
            return highestVolumePair["token0Price"]
        }
        return null
    }
}
