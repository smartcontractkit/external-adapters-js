import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';

export const getTokenQuery = print(gql`
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
`)

export const getPairQuery = print(gql`
    query($token0ID: String, $token1ID: String) {
        pairs(where: {
            token0: $token0ID,
            token1: $token1ID
        }) {
            token0Price,
            token1Price
        }
    }
`)