export interface GraphqlAdapterRequest {
    query: string,
    variables: {
        [T: string]: string | number
    },
    graphqlEndpoint: string
}

export interface TokenInformation {
    id: string
    decimals: number
}