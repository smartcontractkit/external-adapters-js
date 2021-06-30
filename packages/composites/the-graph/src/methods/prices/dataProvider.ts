import * as graphqlAdapter from "@chainlink/graphql-adapter"
import { GraphqlAdapterRequest } from "../../types"
import { AdapterResponse, AdapterRequest } from "@chainlink/types"
import { USDT_USD_AGGREGATOR_V3_ADDRESS } from "../../config"
import { ethers } from "ethers"

export const fetchFromGraphqlAdapter = async (jobRunID: string, data: GraphqlAdapterRequest): Promise<AdapterResponse> => {
    const graphqlExecute = graphqlAdapter.makeExecute()
    const request: AdapterRequest = {
        data: {
            ...data
        },
        id: jobRunID
    }
    return await graphqlExecute(request)
}

export const aggregatorV3InterfaceABI = [
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "description",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint80",
                "name": "_roundId",
                "type": "uint80"
            }
        ],
        "name": "getRoundData",
        "outputs": [
            {
                "internalType": "uint80",
                "name": "roundId",
                "type": "uint80"
            },
            {
                "internalType": "int256",
                "name": "answer",
                "type": "int256"
            },
            {
                "internalType": "uint256",
                "name": "startedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint80",
                "name": "answeredInRound",
                "type": "uint80"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {
                "internalType": "uint80",
                "name": "roundId",
                "type": "uint80"
            },
            {
                "internalType": "int256",
                "name": "answer",
                "type": "int256"
            },
            {
                "internalType": "uint256",
                "name": "startedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint80",
                "name": "answeredInRound",
                "type": "uint80"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "version",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

export const getUSDPriceInUSDT = async (provider: ethers.providers.Provider): Promise<number> => {
    const priceFeed = new ethers.Contract(USDT_USD_AGGREGATOR_V3_ADDRESS, aggregatorV3InterfaceABI, provider);
    const feedResponse = await priceFeed.latestRoundData()
    return feedResponse.answer.toNumber() / 100000000
}