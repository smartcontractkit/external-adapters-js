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

export interface DexSubgraph {
    url: string,
    getToken: (jobRunID: string, symbol: string) => Promise<TokenInformation>,
    getTokenPairPrice: (jobRunID: string, token0Address: string, token1Address: string) => Promise<number | null>
}

export enum ReferenceModifierAction {
    MULTIPLY = "MULTIPLY",
    DIVIDE = "DIVIDE"
}

export interface DexQueryInputParams {
    jobRunID: string,
    baseCoinTicker: string,
    quoteCoinTicker: string,
    dex: string,
    intermediaryToken: string,
    referenceContract: string 
    referenceContractDivisor: number
    referenceModifierAction: ReferenceModifierAction,
}
