import { Contract, JsonRpcProvider } from 'ethers'
import ABI from '../config/ABI.json'
import AccessControlledOCR2Aggregator from '../config/AccessControlledOCR2Aggregator.json'
import EACAggregatorProxy from '../config/EACAggregatorProxy.json'

export const getBounds = async (
  contracts: { asset: string; registry: string },
  provider: JsonRpcProvider,
) => {
  const registryContract = new Contract(contracts.registry, ABI, provider)

  const [
    {
      maxExpectedApy,
      upperBoundTolerance,
      lowerBoundTolerance,
      maxDiscount,
      isUpperBoundEnabled,
      isLowerBoundEnabled,
    },
    proxy,
  ] = await Promise.all([
    registryContract.getParametersForAsset(contracts.asset),
    registryContract.getOracle(contracts.asset),
  ])

  const proxyContract = new Contract(proxy, EACAggregatorProxy, provider)

  if (!isUpperBoundEnabled && !isLowerBoundEnabled) {
    const decimals = await proxyContract.decimals()
    return {
      lower: {
        isLowerBoundEnabled: false,
        latestNav: 0n,
        latestTime: 0,
        maxDiscount: Number(maxDiscount),
        lowerBoundTolerance: Number(lowerBoundTolerance),
      },
      upper: {
        isUpperBoundEnabled: false,
        lookbackNav: 0n,
        lookbackTime: 0,
        maxExpectedApy: Number(maxExpectedApy),
        upperBoundTolerance: Number(upperBoundTolerance),
      },
      decimals: Number(decimals),
    }
  }

  // RoundId jumps on proxy when we swap aggregator
  // We require roundId to be continous so we read from aggregator instead
  const aggregator = await proxyContract.aggregator()
  const aggregatorContract = new Contract(aggregator, AccessControlledOCR2Aggregator, provider)

  const [
    { answer: lookbackNav, updatedAt: lookbackTime },
    { answer: latestNav, updatedAt: latestTime },
    decimals,
  ] = await Promise.all([
    registryContract.getLookbackData(contracts.asset),
    aggregatorContract.latestRoundData(),
    aggregatorContract.decimals(),
  ])

  return {
    lower: {
      isLowerBoundEnabled: Boolean(isLowerBoundEnabled),
      latestNav: BigInt(latestNav),
      latestTime: Number(latestTime),
      maxDiscount: Number(maxDiscount),
      lowerBoundTolerance: Number(lowerBoundTolerance),
    },
    upper: {
      isUpperBoundEnabled: Boolean(isUpperBoundEnabled),
      lookbackNav: BigInt(lookbackNav),
      lookbackTime: Number(lookbackTime),
      maxExpectedApy: Number(maxExpectedApy),
      upperBoundTolerance: Number(upperBoundTolerance),
    },
    decimals: Number(decimals),
  }
}
