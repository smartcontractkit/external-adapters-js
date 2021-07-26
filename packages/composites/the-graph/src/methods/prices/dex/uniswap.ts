import { UNISWAP, WETH} from "../../../config"
import {
	DexQueryInputParams,
	GraphqlAdapterRequest,
	ReferenceModifierAction,
	TokenInformation
} from "../../../types"
import { Logger } from '@chainlink/ea-bootstrap'
import { fetchFromGraphqlAdapter } from "../dataProvider"
import { getPairQuery, getTokenQuery } from "./graphqlQueries"
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'

export class UniswapSubgraph {
	private url: string

	constructor(url: string) {
		this.url = url
	}
	
	// Main method
	async execute(
		jobRunID: string,
		input: DexQueryInputParams,
	): Promise <number> {
		const {
			baseCoinTicker,
			quoteCoinTicker,
			dex,
			referenceContract,
			referenceContractDivisor,
			referenceModifierAction = ReferenceModifierAction.MULTIPLY,
			intermediaryToken = WETH,
			theGraphQuote
		} = input

		const inputParams: DexQueryInputParams = {
			jobRunID,
			baseCoinTicker: baseCoinTicker.toUpperCase(),
			quoteCoinTicker: theGraphQuote ? theGraphQuote.toUpperCase() : quoteCoinTicker.toUpperCase(),
			dex: UNISWAP,
			referenceContract,
			referenceContractDivisor,
			referenceModifierAction: referenceModifierAction.toUpperCase() as ReferenceModifierAction,
			intermediaryToken: intermediaryToken.toUpperCase(),
			theGraphQuote
		}
		if (baseCoinTicker === quoteCoinTicker) {
			throw new Error("Base and Quote coins must be different")
		}
		Logger.info(`Fetching quote for ${quoteCoinTicker}/${baseCoinTicker} pair from ${dex}`)
		let price
		try {
			price = await this.getQuotePrice(inputParams)
		} catch (e) {
			throw new Error(`Failed to get price.  Reason "${e}"`)
		}
		return price
	}

	async getToken(jobRunID: string, symbol: string): Promise < TokenInformation > {
		const data: GraphqlAdapterRequest = {
			query: getTokenQuery,
			variables: {
				symbol
			},
			graphqlEndpoint: this.url
		}
		const response = await fetchFromGraphqlAdapter(jobRunID, data)
		if (!response.result.data) {
			const error = response.result.error || "Failed to get token information"
			throw new Error(error)
		}
		const tokens = response.result.data.tokens
		if (tokens.length !== 1) {
			throw new Error(`Token ${symbol} not found`)
		}
		const token = tokens[0]
		return {
			id: token.id as string,
			decimals: token.decimals as number
		}
	}

	async getTokenPairPrice(jobRunID: string, token0Address: string, token1Address: string): Promise < number | null > {
		const req1Data: GraphqlAdapterRequest = {
			query: getPairQuery,
			variables: {
				"token0ID": token0Address,
				"token1ID": token1Address
			},
			graphqlEndpoint: this.url
		}
		const req1Response = await fetchFromGraphqlAdapter(jobRunID, req1Data)
		const req1Pairs = req1Response.result.data.pairs
		if (req1Pairs.length > 0) {
			const highestVolumePair = req1Pairs[0]
			return highestVolumePair["token1Price"]
		}

		// Try reverse token0 and token1
		const req2Data: GraphqlAdapterRequest = {
			query: getPairQuery,
			variables: {
				"token0ID": token1Address,
				"token1ID": token0Address
			},
			graphqlEndpoint: this.url
		}

		const req2Response = await fetchFromGraphqlAdapter(jobRunID, req2Data)
		const req2Pairs = req2Response.result.data.pairs
		if (req2Pairs.length > 0) {
			const highestVolumePair = req2Pairs[0]
			return highestVolumePair["token0Price"]
		}
		return null
	}

	async getQuotePrice(
		inputParams: DexQueryInputParams,
	): Promise < number > {
		const {
			jobRunID,
			baseCoinTicker,
			quoteCoinTicker,
			referenceContract
		} = inputParams
		const token0 = await this.getToken(jobRunID, baseCoinTicker)
		const token1 = await this.getToken(jobRunID, quoteCoinTicker)
		let token1PerToken0 = await this.getTokenPairPrice(jobRunID, token0.id, token1.id)
		if (!token1PerToken0) {
			token1PerToken0 = await this.getPriceThroughCommonPair(
				inputParams,
				token0.id,
				token1.id,
			)
		}
		Logger.info(`Price of ${quoteCoinTicker}/${baseCoinTicker} is ${token1PerToken0}`)
		if (referenceContract) {
			token1PerToken0 = await this.modifyResultByFeedResult(inputParams, token1PerToken0)
		}
		return token1PerToken0
	}

	async getPriceThroughCommonPair(
		inputParams: DexQueryInputParams,
		token0ID: string,
		token1ID: string,
	): Promise < number > {
		const {
			jobRunID,
			baseCoinTicker,
			quoteCoinTicker,
			intermediaryToken: intermediaryTokenTicker,
		} = inputParams
		Logger.info(
			`${quoteCoinTicker}/${baseCoinTicker} pair does not exist.  Determining price using intermediary token ${intermediaryTokenTicker}`,
		)
		const intermediaryToken = await this.getToken(jobRunID, intermediaryTokenTicker)
		const refTokenPerToken0 = await this.getTokenPairPrice(
			jobRunID,
			token0ID,
			intermediaryToken.id,
		)
		const refTokenPerToken1 = await this.getTokenPairPrice(
			jobRunID,
			token1ID,
			intermediaryToken.id,
		)
		this.validateTokenPrices(refTokenPerToken0, refTokenPerToken1, baseCoinTicker, quoteCoinTicker)
		return (refTokenPerToken0 as number) / (refTokenPerToken1 as number)
	}

	validateTokenPrices(
		priceOne: number | null,
		priceTwo: number | null,
		priceOneTicker: string,
		priceTwoTicker: string,
	) {
		if (!priceOne || !priceTwo) {
			if (!priceOne) {
				throw new Error(
					`Failed to get price because we could not determine the price of ${priceOneTicker}`,
				)
			}
			if (!priceTwo) {
				throw new Error(
					`Failed to get price because we could not determine the price of ${priceTwoTicker}`,
				)
			}
		}
	}

	async modifyResultByFeedResult(
		inputParams: DexQueryInputParams,
		currentPrice: number,
	): Promise < number > {
		const {
			baseCoinTicker,
			quoteCoinTicker,
			referenceContract,
			referenceContractDivisor,
			referenceModifierAction,
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