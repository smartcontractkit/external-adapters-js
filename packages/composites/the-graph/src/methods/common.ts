import { Logger } from '@chainlink/ea-bootstrap'
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'
import { DexQueryInputParams, ReferenceModifierAction } from "../types"

export const modifyResultByFeedResult = async (
    inputParams: DexQueryInputParams,
    currentPrice: number,
): Promise < number > => {
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
