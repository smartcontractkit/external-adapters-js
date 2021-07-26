import {
	DexQueryInputParams,
	GraphqlAdapterRequest,
	PoolBalance,
	PoolInformation,
	ReferenceModifierAction,
	UnderlyingCoins
} from "../../../types"
import { fetchFromGraphqlAdapter } from "../dataProvider"
import { getPoolsQuery, getTokenPoolQuery} from "./graphqlQueries"
import { Logger } from '@chainlink/ea-bootstrap'
import { CURVE } from "../../../config"
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'

export class CurveSubgraph {
	private url: string

	constructor(url: string) {
		this.url = url
	}

	// Main method
	async execute(jobRunID: string, input: DexQueryInputParams): Promise < number > {
		const {
			baseCoinTicker,
			quoteCoinTicker,
			dex,
			referenceContract,
			referenceContractDivisor,
			referenceModifierAction = ReferenceModifierAction.MULTIPLY,
			intermediaryToken,
			theGraphQuote
		} = input

		const inputParams: DexQueryInputParams = {
			jobRunID,
			baseCoinTicker: baseCoinTicker,
			quoteCoinTicker: theGraphQuote ? theGraphQuote : quoteCoinTicker,
			dex: CURVE,
			referenceContract,
			referenceContractDivisor,
			referenceModifierAction: referenceModifierAction.toUpperCase() as ReferenceModifierAction,
			intermediaryToken,
			theGraphQuote
		}
		if (baseCoinTicker === quoteCoinTicker) {
			throw new Error("Base and Quote coins must be different")
		}
		Logger.info(`Fetching quote for ${quoteCoinTicker}/${baseCoinTicker} pair from ${dex}`)
		let price
		try {
			price = await this.getPoolPrice(jobRunID, inputParams)
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

	async getPoolPrice(jobRunID: string, inputParams: DexQueryInputParams): Promise < number > {
		const {
			baseCoinTicker,
			quoteCoinTicker,
			referenceContract,
			referenceContractDivisor
		} = inputParams
		const tokenPollsName = await this.getTokenPoolName(jobRunID, quoteCoinTicker)
		Logger.info(`Found ${tokenPollsName.length} pools`)
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
		if(!referenceContract) {
			return poolUnderlyingPrice
		}
		const mofifiedPrice  = await this.modifyResultByFeedResult(inputParams, referenceContractDivisor)
		return mofifiedPrice
	}

	async modifyResultByFeedResult (
		inputParams: DexQueryInputParams,
		currentPrice: number,
	): Promise < number > {
		const {
			baseCoinTicker,
			quoteCoinTicker,
			referenceContract,
			referenceContractDivisor,
			referenceModifierAction
		} = inputParams

		Logger.info(
			`Price of ${quoteCoinTicker}/${baseCoinTicker} is going to be modified by the result returned from ${referenceContract} by ${referenceContractDivisor}`,
		)
		const modifierTokenPrice = await getLatestAnswer(referenceContract, referenceContractDivisor)
		Logger.info(`Feed ${referenceContract} returned a value of ${modifierTokenPrice}`)
		if (referenceModifierAction === ReferenceModifierAction.DIVIDE) {
			return currentPrice / modifierTokenPrice
		}
		return currentPrice * modifierTokenPrice
	}
}
