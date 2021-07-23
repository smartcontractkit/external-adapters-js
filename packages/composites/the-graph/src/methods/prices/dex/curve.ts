import {
	DexQueryInputParams,
	GraphqlAdapterRequest,
	PoolBalance,
	PoolInformation,
	UnderlyingCoins
} from "../../../types"
import { fetchFromGraphqlAdapter } from "../dataProvider"
import { getPoolsQuery, getTokenPoolQuery} from "./graphqlQueries"
import { Decimal } from 'decimal.js'
import { Logger } from '@chainlink/ea-bootstrap'
import { DEFAULT_ORACLE_ADDRESS } from "../../../config"
import { getRpcLatestRound } from '@chainlink/ea-reference-data-reader'

export class CurveSubgraph {
	private url: string

	constructor(url: string) {
		this.url = url
	}

	// Main method
	async execute(jobRunID: string, input: DexQueryInputParams): Promise < Decimal > {
		const {
			baseCoinTicker,
			quoteCoinTicker
		} = input
		if (baseCoinTicker === quoteCoinTicker) {
			throw new Error("Base and Quote coins must be different")
		}
		let price
		try {
			price = await this.getPoolPrice(jobRunID, input)
		} catch (e) {
			throw new Error(`Failed to get price. Reason "${e}"`)
		}
		return price
	}
	
	async getPool(jobRunID: string, name: string): Promise < PoolInformation > {
		const data: GraphqlAdapterRequest = {
			query: getPoolsQuery,
			variables: {
				name
			},
			graphqlEndpoint: this.url
		}
		const response = await fetchFromGraphqlAdapter(jobRunID, data)
		if (!response.result.data) {
			const error = response.result.error || "Failed to get pool information"
			throw new Error(error)
		}
		const pool = response.result.data.pools[0];
		return pool
	}

	async getTokenPoolName(jobRunID: string, symbol: string): Promise < any > {
		const data: GraphqlAdapterRequest = {
			query: getTokenPoolQuery,
			variables: {
				symbol
			},
			graphqlEndpoint: this.url
		}
		const response = await fetchFromGraphqlAdapter(jobRunID, data)
		if (!response.result.data.tokens.length) {
			const error = response.result.error || "Failed to get token information, enter the exact Token symbol"
			throw new Error(error)
		}
		const tokensPolls = response.result.data.tokens[0].coins
		const pools = tokensPolls.map((coin: any) => {
			return coin.pool.name
		})
		return pools
	}

	async getPoolPrice(jobRunID: string, input: DexQueryInputParams): Promise < Decimal > {
		const {
			baseCoinTicker,
			quoteCoinTicker,
			referenceContract
		} = input
		const tokenPollsName = await this.getTokenPoolName(jobRunID, quoteCoinTicker)
		Logger.info(`Founded ${tokenPollsName.length} pools`)
		const balances = await Promise.all(tokenPollsName.map(async (name: string) => {
			const pools = await this.getPool(jobRunID, name);
			Logger.info(`Fetching balance from '${name}' pool`)
			let token0Balance
			let token1Balance
			pools.underlyingCoins.map((pool: UnderlyingCoins) => {
				if (quoteCoinTicker === pool.token.symbol) {
					token0Balance = pool.balance
				}
				if (baseCoinTicker === pool.token.symbol) {
					token1Balance = pool.balance
				}
			})
			if (token0Balance === undefined || token1Balance === undefined) {
				Logger.info(`'${name}' pool doesn't have both tokens`)
				return null
			}
			return {
				token0Balance,
				token1Balance
			}
		}))
		const pool = balances.filter(pool => pool) as PoolBalance[]
		if (!pool.length) {
			throw new Error(`There is not a ${quoteCoinTicker}/${baseCoinTicker} pool`)
		}
		const token0Balance = pool[0].token0Balance
		const token1Balanace = pool[0].token1Balance
		const poolUnderlyingPrice = token1Balanace / token0Balance
		Logger.info(`Price of ${quoteCoinTicker}/${baseCoinTicker} is ${poolUnderlyingPrice}`)
		const usdFeedPrice = await this.getFeedPrice(referenceContract)
		Logger.info(`Price of ${baseCoinTicker}/USD is ${usdFeedPrice}`)
		const price = usdFeedPrice.mul(poolUnderlyingPrice)
		Logger.info(`Price of ${quoteCoinTicker}/USD is ${price}`)
		return price
	}

	async getFeedPrice(referenceContract: string): Promise < Decimal > {
		const multiply = 1e8
		let oracleAddress = referenceContract
		if (!oracleAddress) {
			oracleAddress = DEFAULT_ORACLE_ADDRESS
		}
		const roundData = await getRpcLatestRound(oracleAddress)
		const usdPrice = new Decimal(roundData.answer.toString()).div(multiply)
		return usdPrice
	}
}
