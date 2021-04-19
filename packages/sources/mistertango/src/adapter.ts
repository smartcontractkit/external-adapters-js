import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { getBalance, getList, sendMoney } from './endpoint'
import ms from "microseconds"
import CryptoJS from "crypto-js"
import querystring from "querystring";

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  config.api.headers = {
    ...config.api.headers,
    'X-API-NONCE': getNonce(),
  }

  switch (endpoint.toLowerCase()) {
    case 'read':
    case getBalance.NAME: {
      return await getBalance.execute(request, config)
    }
    case getList.NAME:
    case 'getlist': {
      return await getList.execute(request, config)
    }
    case 'write':
    case sendMoney.NAME: {
      return await sendMoney.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

const getNonce = () => new Date().getTime() + '' + Math.round(ms.now() / 100000000);

export const makeSignature = (secret: string, nonce: number, data: RequestData, command_url: string) => {
    const hashString = nonce + querystring.stringify(data);
    const hashed = CryptoJS.SHA256(hashString).toString(CryptoJS.enc.Latin1);
    const encoded = CryptoJS.enc.Latin1.parse(command_url + hashed);
    return CryptoJS.HmacSHA512(encoded, secret).toString(CryptoJS.enc.Base64);
};

type RequestData = {
  username: string
  date? : string
  dateFrom? : string
  dateTill?: string
  page?: number
  amount?: number
  currency?: string
  recipient?: string
  account?: string
  details?: string
}
