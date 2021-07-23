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
    theGraphQuote: string
}

export interface PoolInformation {
    name: string,
    coinCounts: string,
    underlyingCoins: UnderlyingCoins[]
}
export interface UnderlyingCoins {
    balance: string,
    token: {
        symbol: string
    }
}
export interface PoolBalance {
    token0Balance: number,
    token1Balance: number
}
