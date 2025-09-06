// import CryptoJS from 'crypto-js'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import crypto from 'crypto'
import {
  ActiveStakesEndpointResponse,
  OutstandingStakesEndpointResponse,
  PendingStakesEndpointResponse,
  WalletsEndpointResponse,
} from './types'

export const getWallets = async (
  portfolioId: string,
  currencies: string[],
  baseUrl: string,
  apiKey: string,
  apiSecret: string,
  requester: Requester,
): Promise<WalletsEndpointResponse> => {
  const params = {
    portfolioId,
    currencies,
  }

  const requestConfig = {
    baseURL: baseUrl,
    url: '/platform/wallets',
    method: 'GET',
    headers: generateRequestHeaders('GET', '/platform/wallets', '', apiKey, apiSecret),
    //params, NOTE: this was commented out because adding param to the request fails on Copper API - that was what I observed
  }

  const response = await requester.request<WalletsEndpointResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  return response.response.data
}

export const getActiveStakes = async (
  portfolioId: string,
  currencies: string[],
  baseUrl: string,
  apiKey: string,
  apiSecret: string,
  requester: Requester,
): Promise<ActiveStakesEndpointResponse> => {
  const params = {
    portfolioId,
    currencies,
  }

  const requestConfig = {
    baseURL: baseUrl,
    url: '/platform/staking/active-stakes',
    method: 'GET',
    headers: generateRequestHeaders(
      'GET',
      '/platform/staking/active-stakes',
      '',
      apiKey,
      apiSecret,
    ),
    // params,NOTE: this was commented out because adding param to the request fails on Copper API - that was what I observed
  }

  const response = await requester.request<ActiveStakesEndpointResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  return response.response.data
}

export const getPendingStakes = async (
  portfolioId: string,
  currencies: string[],
  baseUrl: string,
  apiKey: string,
  apiSecret: string,
  requester: Requester,
): Promise<PendingStakesEndpointResponse> => {
  const params = {
    portfolioId,
    currencies,
  }

  const requestConfig = {
    baseURL: baseUrl,
    url: '/platform/staking/pending-stakes',
    method: 'GET',
    headers: generateRequestHeaders(
      'GET',
      '/platform/staking/pending-stakes',
      '',
      apiKey,
      apiSecret,
    ),
    // params, NOTE: this was commented out because adding param to the request fails on Copper API - that was what I observed
  }

  const response = await requester.request<PendingStakesEndpointResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  return response.response.data
}

export const getOutstandingStakes = async (
  portfolioId: string,
  currencies: string[],
  baseUrl: string,
  apiKey: string,
  apiSecret: string,
  requester: Requester,
): Promise<OutstandingStakesEndpointResponse> => {
  const params = {
    portfolioId,
    currencies,
  }

  const requestConfig = {
    baseURL: baseUrl,
    url: '/platform/staking/outstanding-stakes',
    method: 'GET',
    headers: generateRequestHeaders(
      'GET',
      '/platform/staking/outstanding-stakes',
      '',
      apiKey,
      apiSecret,
    ),
    // params, NOTE: this was commented out because adding param to the request fails on Copper API - that was what I observed
  }

  const response = await requester.request<OutstandingStakesEndpointResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  return response.response.data
}

const generateRequestHeaders = (
  method: string,
  path: string,
  body = '',
  apiKey: string,
  apiSecret: string,
): any => {
  console.log(apiKey, apiSecret)
  const timestamp = Date.now().toString()
  const signature = generateSignature(timestamp, method, path, body, apiSecret)
  console.log('signature:', signature)

  return {
    Authorization: `ApiKey ${apiKey}`,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  }
}

const generateSignature = (
  timestamp: string,
  method: string,
  path: string,
  body = '',
  apiSecret: string,
): string => {
  // console.log(timestamp, method, path, body, apiSecret)
  const preHash = timestamp + method.toUpperCase() + path + body
  console.log(preHash)
  return crypto.createHmac('sha256', apiSecret).update(preHash).digest('hex')
}
