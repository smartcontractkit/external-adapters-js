import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { Decimal } from 'decimal.js'
import { request } from './wallet/requester'

interface MirrorXResponse {
  binanceUID: string
  coinSymbol: string
  mirrorXBalance: string
  mirrorXLinkId: string
  walletIdStr: string
}

export const getAssetPositions = async (
  mirrorXLinkIds: string[],
  url: string,
  proxy: string,
  apiKey: string,
  privateKey: string,
  requester: Requester,
): Promise<{ exchangeBalances: string[]; sum: Decimal }> => {
  const responses = await Promise.all(
    mirrorXLinkIds.map(async (id) => {
      return request<MirrorXResponse, { exchangeBalance: string }>(
        url,
        '/open-api/v1/mirrorX/positions/list',
        { mirrorXLinkId: id, excludeZeroAmountFlag: true },
        apiKey,
        privateKey,
        requester,
        proxy,
      )
    }),
  )

  for (const response of responses) {
    if (!response?.extra?.length) {
      throw new AdapterError({
        statusCode: 500,
        message: 'Ceffu API does not return data',
      })
    }
  }

  const exchangeBalances = responses.flatMap(({ extra }) =>
    extra.map(({ exchangeBalance }) => exchangeBalance),
  )

  return {
    exchangeBalances,
    sum: exchangeBalances.reduce((sum, elem) => sum.add(new Decimal(elem)), new Decimal(0)),
  }
}
