export const getTokenQuery = `
    query($symbol: String) {
        tokens(
            where:{
            symbol: $symbol
            }, 
            orderBy: tradeVolumeUSD, orderDirection:desc, first: 1
        ) {
        id,
        name
        }
    }
`

export const getPairQuery = `
    query($token0ID: String, $token1ID: String) {
        pairs(where: {
            token0: $token0ID,
            token1: $token1ID
        }) {
            token0Price,
            token1Price
        }
    }
`

export const getTokenPoolQuery = `
    query($symbol: String) {
        tokens(where: {
            symbol: $symbol
        }){
            coins {
                pool {
                    name
                }
            }
        }
    }
`

export const getPoolsQuery = `
    query($name: String) {
        pools(where: {
            name : $name
        }) {
            name,
            underlyingCoins {
                balance,
                token {
                    name,
                    symbol
                }
            }
        }
    }
`
