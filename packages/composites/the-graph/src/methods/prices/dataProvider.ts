import * as graphqlAdapter from "@chainlink/graphql-adapter"
import { GraphqlAdapterRequest } from "../../types"
import { AdapterResponse, AdapterRequest } from "@chainlink/types"

export const fetchFromGraphqlAdapter = async (jobRunID: string, data: GraphqlAdapterRequest): Promise<AdapterResponse> => {
    const graphqlExecute = graphqlAdapter.makeExecute()
    const request: AdapterRequest = {
        data,
        id: jobRunID
    }
    return await graphqlExecute(request)
}
