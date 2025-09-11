import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { createPrivateKey, createSign } from 'crypto'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { stringify } from 'querystring'

const logger = makeLogger('Requester')

type Data<T, E> = {
  data: T[]
  totalPage: number
  pageNo: number
  pageLimit: number
} & E

interface GeneralResponse<T, E> {
  data: Data<T, E>
  code: string
  message: string
}

type EmptyParams = Record<string, never>
type WalletAssetListParams = {
  walletId: string
}
type MirrorXParams = {
  mirrorXLinkId: string
  excludeZeroAmountFlag: boolean
}

const successCode = '000000'

export const request = async <T, E = EmptyParams>(
  baseUrl: string,
  url: string,
  params: EmptyParams | WalletAssetListParams | MirrorXParams,
  apiKey: string,
  privateKey: string,
  requester: Requester,
  proxy?: string,
) => {
  const results: {
    data: T[]
    extra: E[]
  } = {
    data: [],
    extra: [],
  }

  const finalParam = {
    ...params,
    pageLimit: 500,
    pageNo: 1,
    timestamp: Date.now(),
  }

  let requestNextPage = true
  while (requestNextPage) {
    const requestConfig = {
      baseURL: baseUrl,
      url: url,
      method: 'GET',
      httpsAgent: proxy && proxy.length > 0 ? new HttpsProxyAgent(proxy) : null,
      headers: {
        'open-apikey': apiKey,
        signature: sign(stringify(finalParam), privateKey),
      },
      params: finalParam,
    }

    try {
      const response = await requester.request<GeneralResponse<T, E>>(
        JSON.stringify(requestConfig),
        requestConfig,
      )

      if (!response || !response.response || !response.response.data) {
        throw new AdapterError({
          statusCode: 500,
          message: `Ceffu wallet API ${url} does not return data`,
        })
      }

      const responseData = response.response.data
      if (responseData.code != successCode) {
        throw new AdapterError({
          statusCode: 500,
          message: `Ceffu wallet API ${url} failed, code: ${responseData.code}, message:${responseData.message}`,
        })
      }

      requestNextPage = responseData.data.pageNo < responseData.data.totalPage
      finalParam.pageNo = responseData.data.pageNo + 1

      results.data.push(...responseData.data.data)

      // We use de-construction here to filter only fields coming from E
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, totalPage, pageNo, pageLimit, ...extra } = responseData.data
      if (Object.keys(extra).length !== 0) {
        results.extra.push(extra as unknown as E)
      }
    } catch (e) {
      if ((e as any)?.errorResponse?.message == 'Invalid IP address') {
        logger.error(
          'Ceffu blocked you because your IP address is not white-listed with them. For CLL internal: Please turn on VPN. For Nops: Please double check if you IP address has changed or not',
        )
      }
      throw e
    }
  }

  return results
}

export const sign = (data: string, privateKey: string) => {
  const key = createPrivateKey({
    key: Buffer.from(privateKey, 'base64'),
    type: 'pkcs8',
    format: 'der',
  })

  const sign = createSign('sha512WithRSAEncryption')
  sign.write(data)
  sign.end()

  return sign.sign(key, 'base64')
}
