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