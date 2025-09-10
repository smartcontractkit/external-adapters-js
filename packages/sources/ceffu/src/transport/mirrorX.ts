import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { Decimal } from 'decimal.js'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { stringify } from 'querystring'
// TODO: Refactor to use request instead
// https://smartcontract-it.atlassian.net/browse/OPDATA-4224
import { sign } from './wallet/requester'

interface ApiResponse {
  data: {
    data: {
      binanceUID: string
      coinSymbol: string
      mirrorXBalance: string
      mirrorXLinkId: string
      walletIdStr: string
    }[]
    exchangeBalance: string
    pageLimit: number
    pageNo: number
    totalPage: number
  }
  code: string
  message: string
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
      const params = {
        mirrorXLinkId: id,
        excludeZeroAmountFlag: true,
        pageLimit: 500,
        pageNo: 1,
        timestamp: Date.now(),
      }
      const requestConfig = {
        baseURL: url,
        url: '/open-api/v1/mirrorX/positions/list',
        method: 'GET',
        httpsAgent: new HttpsProxyAgent(proxy),
        headers: {
          'open-apikey': apiKey,
          signature: sign(stringify(params), privateKey),
        },
        params,
      }

      return requester.request<ApiResponse>(JSON.stringify(requestConfig), requestConfig)
    }),
  )

  for (const response of responses) {
    if (!response.response || !response.response.data) {
      throw new AdapterError({
        statusCode: 500,
        message: 'Ceffu API does not return data',
      })
    }

    if (!response.response.data.data?.exchangeBalance) {
      throw new AdapterError({
        statusCode: 500,
        message: `Ceffu API does not return exchangeBalance, code: ${response.response.data.code}, message:${response.response.data.message}`,
      })
    }
  }

  return {
    exchangeBalances: responses.flatMap((r) => r.response.data.data.exchangeBalance),
    sum: responses.reduce(
      (sum, elem) => sum.add(new Decimal(elem.response.data.data.exchangeBalance)),
      new Decimal(0),
    ),
  }
}
