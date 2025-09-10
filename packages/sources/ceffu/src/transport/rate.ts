import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers, parseUnits } from 'ethers'
import abi from '../config/abi.json'

export const scale = (value: bigint, decimals: { from: number; to: number }): bigint => {
  if (decimals.from > decimals.to) {
    return value / 10n ** BigInt(decimals.from - decimals.to)
  } else {
    return value * 10n ** BigInt(decimals.to - decimals.from)
  }
}

export const toUsd = async (
  coins: { coin: string; amount: string; data?: Record<string, string> }[],
  contracts: Record<string, string>,
  provider: ethers.JsonRpcProvider,
) => {
  return await Promise.all(
    coins.map(async (c) => {
      const rate = await getUSDRate(getContract(c.coin, contracts), provider)
      const value = scale(parseUnits(c.amount, rate.decimal) * rate.value, {
        from: rate.decimal,
        to: 0,
      })
      return {
        coin: c.coin.toUpperCase(),
        amount: c.amount,
        rate: rate.value,
        decimal: rate.decimal,
        value,
        data: c.data,
      }
    }),
  )
}

export const getUSDRate = async (contracts: string, provider: ethers.JsonRpcProvider) => {
  const contract = new ethers.Contract(contracts, abi, provider)
  const [decimal, value]: [bigint, bigint] = await Promise.all([
    contract.decimals(),
    contract.latestAnswer(),
  ])

  return {
    value,
    decimal: Number(decimal),
  }
}

const getContract = (coin: string, contracts: Record<string, string>) => {
  const coinInUpperCase = coin.toUpperCase()
  if (!contracts[coinInUpperCase]) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `${coinInUpperCase} is missing from ${JSON.stringify(Object.keys(contracts))}`,
    })
  }

  return contracts[coinInUpperCase]
}
