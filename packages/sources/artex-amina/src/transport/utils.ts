import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

// aum is published as a share count with at most four decimal places.
export const AUM_DECIMALS = 4

/**
 * Returns the quantity that the provider gave unchanged. The value is a share
 * count, so it must be a non-negative number with no more decimal places than
 * the schema holds; the adapter rounds, scales and converts nothing.
 */
export const validateAum = (quantity: number, isin: string): number => {
  if (
    typeof quantity !== 'number' ||
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    Number(quantity.toFixed(AUM_DECIMALS)) !== quantity
  ) {
    throw new AdapterError({
      statusCode: 502,
      message: `The provider returned an unusable quantity for ISIN ${isin}: ${quantity}`,
    })
  }

  return quantity
}
