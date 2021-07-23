import { DexCurveSubgraph, GraphqlAdapterRequest, PoolInformation } from "../../../types"
import { fetchFromGraphqlAdapter } from "../dataProvider"
import { getPoolsQuery, getTokenPoolQuery } from "./graphqlQueries"

export class CurveSubgraph implements DexCurveSubgraph {
    private url: string 

    constructor(url: string) {
        this.url = url 
    }

    async getPool(jobRunID: string, name: string): Promise<PoolInformation> {
        const data: GraphqlAdapterRequest = {
            query: getPoolsQuery,
            variables: {
                name
            },
            graphqlEndpoint: this.url
        }
        const response = await fetchFromGraphqlAdapter(jobRunID, data)
        if(!response.result.data) {
            const error = response.result.error || "Failed to get pool information"
            throw new Error(error)
        }
        const pool = response.result.data.pools[0];
        return pool
    }

    async getTokenPoolName(jobRunID: string, symbol:string): Promise<any> {
        const data : GraphqlAdapterRequest = {
            query: getTokenPoolQuery,
            variables: {
                symbol
            },
            graphqlEndpoint: this.url
        }
        const response = await fetchFromGraphqlAdapter(jobRunID, data)
        if(!response.result.data.tokens.length) {
            const error = response.result.error || "Failed to get token information, enter the exact Token symbol"
            throw new Error(error)
        }
        const tokensPolls = response.result.data.tokens[0].coins
        const pools = tokensPolls.map((coin:any) => {
            return coin.pool.name
        })
        return pools
    }
}
