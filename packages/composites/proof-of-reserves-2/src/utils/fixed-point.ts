import * as objectPath from 'object-path'

export type FixedPoint = {
  amount: bigint
  decimals: number
}

type NumberType = FixedPoint | number

const isFixedPoint = (num: NumberType): num is FixedPoint => {
  return typeof num !== 'number' && 'amount' in num && 'decimals' in num
}

export const toFixedPointWithDecimals = (num: NumberType, decimals: number): FixedPoint => {
  if (!isFixedPoint(num)) {
    return {
      amount: BigInt(Math.trunc(num * 10 ** decimals)),
      decimals,
    }
  }

  let amount = num.amount
  if (decimals !== num.decimals) {
    amount = (amount * 10n ** BigInt(decimals)) / 10n ** BigInt(num.decimals)
  }
  return {
    amount,
    decimals,
  }
}

export const fixedPointToNumber = (num: FixedPoint): number => {
  return Number(num.amount) / 10 ** num.decimals
}

export const add = (a: FixedPoint, b: FixedPoint): FixedPoint => {
  const resultDecimals = Math.max(a.decimals, b.decimals)
  a = toFixedPointWithDecimals(a, resultDecimals)
  b = toFixedPointWithDecimals(b, resultDecimals)
  return {
    amount: a.amount + b.amount,
    decimals: resultDecimals,
  }
}

export const multiply = (a: FixedPoint, b: FixedPoint): FixedPoint => {
  const decimals = Math.max(a.decimals, b.decimals)
  const amount = (a.amount * b.amount) / 10n ** BigInt(a.decimals + b.decimals - decimals)
  return {
    amount,
    decimals,
  }
}

export const divide = (a: FixedPoint, b: FixedPoint): FixedPoint => {
  const decimals = Math.max(a.decimals, b.decimals)
  const amount = (a.amount * 10n ** BigInt(decimals + b.decimals - a.decimals)) / b.amount
  return {
    amount,
    decimals,
  }
}

export const getFixedPointFromResult = ({
  result,
  amountPath,
  decimalsPath,
  defaultDecimals,
}: {
  result: Record<string, unknown>
  amountPath: string
  decimalsPath: string | undefined
  defaultDecimals: number
}): FixedPoint => {
  const amount: number | string = objectPath.get(result, amountPath)
  if (amount === undefined) {
    throw new Error(`Amount not found at path '${amountPath}'`)
  }
  if (decimalsPath) {
    const decimals = Number(objectPath.get(result, decimalsPath))
    if (!Number.isFinite(decimals)) {
      throw new Error(`Decimals not found at path '${decimalsPath}'`)
    }
    return {
      amount: BigInt(amount),
      decimals: decimals,
    }
  }
  return toFixedPointWithDecimals(Number(amount), defaultDecimals)
}
