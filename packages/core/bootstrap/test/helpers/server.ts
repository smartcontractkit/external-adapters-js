import Fastify, { FastifyInstance } from 'fastify'

const DEFAULT_PORT = 18080

const SUCCESS_JSON_PATH = 'successJSON'
export const SUCCESS_JSON_RESPONSE = {
  result: 'success',
  value: 1,
}

const SUCCESS_ARRAY_PATH = 'successArray'
export const SUCCESS_ARRAY_RESPONSE = ['1']

const SUCCESS_NUMBER_PATH = 'successNumber'
export const SUCCESS_NUMBER_RESPONSE = 1

const SUCCESS_STRING_PATH = 'successString'
export const SUCCESS_STRING_RESPONSE = 'STRING'

const SUCCESS_BATCHLIKE_PATH = 'successBatchlike'
export const SUCCESS_BATCHLIKE_RESPONSE = {
  result: 'success',
  value: [1, 2, 3],
}

const ERROR_PATH = 'error'
const ERROR_RESPONSE = 'There was an error'
const ERROR_TWICE_PATH = 'errorsTwice'
const ERROR_CUSTOM_PATH = 'customError'
export const ERROR_CUSTOM_RESPONSE = {
  result: 'error',
  value: 1,
}

const ERROR_PATH_V2 = 'error-v2'
const ERROR_PATH_V3 = 'error-v3'

export const ERROR_RESPONSE_V2 = {
  jobRunID: '1',
  status: 'errored',
  statusCode: 504,
  providerStatusCode: 504,
  error: {
    name: 'Data Provider Request Timeout error',
    message: 'timeout of 10000ms exceeded',
    url: 'https:/adapters.main.prod.cldev.sh/view-function-multi-chain',
    feedID: 'f38697bba7779c2344dfdea094db4ee7',
  },
}

export const ERROR_RESPONSE_V3 = {
  statusCode: 502,
  errorMessage: 'Missing BSC_RPC_URL or BSC_RPC_CHAIN_ID environment variables',
  timestamps: {
    providerDataRequestedUnixMs: 0,
    providerDataReceivedUnixMs: 0,
  },
  meta: {
    adapterName: 'POR_ADDRESS_LIST',
    metrics: {
      feedId:
        '{"contractAddress":"0x1ce4cf759bd9594f17f4f241773a4201879b402d","contractAddressNetwork":"bsc","abiName":"solvsolanamultiaddresslist","type":"tokens","confirmations":0,"batchSize":10}',
    },
  },
}

const responseLookup = {
  [SUCCESS_JSON_PATH]: SUCCESS_JSON_RESPONSE,
  [SUCCESS_ARRAY_PATH]: SUCCESS_ARRAY_RESPONSE,
  [SUCCESS_NUMBER_PATH]: SUCCESS_NUMBER_RESPONSE,
  [SUCCESS_STRING_PATH]: SUCCESS_STRING_RESPONSE,
  [SUCCESS_BATCHLIKE_PATH]: SUCCESS_BATCHLIKE_RESPONSE,
  [ERROR_RESPONSE]: ERROR_PATH,
  [ERROR_TWICE_PATH]: ERROR_PATH,
  [ERROR_CUSTOM_PATH]: ERROR_CUSTOM_RESPONSE,
  [ERROR_PATH_V2]: ERROR_RESPONSE_V2,
  [ERROR_PATH_V3]: ERROR_RESPONSE_V3,
}

type Endpoint =
  | typeof SUCCESS_JSON_PATH
  | typeof SUCCESS_ARRAY_PATH
  | typeof SUCCESS_NUMBER_PATH
  | typeof SUCCESS_STRING_PATH
  | typeof SUCCESS_BATCHLIKE_PATH
  | typeof ERROR_PATH
  | typeof ERROR_PATH_V3
  | typeof ERROR_TWICE_PATH
  | typeof ERROR_CUSTOM_PATH

export class Server {
  app: FastifyInstance | null
  port: number
  errorCount: number

  constructor() {
    this.app = null
    this.port = DEFAULT_PORT
    this.errorCount = 0
  }

  start(): void {
    const app = Fastify({
      logger: false,
    })

    app.get(`/${SUCCESS_JSON_PATH}`, (_, res) => {
      res.status(200).send(SUCCESS_JSON_RESPONSE)
    })

    app.get(`/${SUCCESS_ARRAY_PATH}`, (_, res) => {
      res.status(200).send(SUCCESS_ARRAY_RESPONSE)
    })

    app.get(`/${SUCCESS_NUMBER_PATH}`, (_, res) => {
      res.status(200).send(SUCCESS_NUMBER_RESPONSE)
    })

    app.get(`/${SUCCESS_STRING_PATH}`, (_, res) => {
      res.status(200).send(SUCCESS_STRING_RESPONSE)
    })

    app.get(`/${SUCCESS_BATCHLIKE_PATH}`, (_, res) => {
      res.status(200).send(SUCCESS_BATCHLIKE_RESPONSE)
    })

    app.get(`/${ERROR_PATH}`, (_, res) => {
      this.errorCount++
      res.status(500).send(ERROR_RESPONSE)
    })

    app.get(`/${ERROR_TWICE_PATH}`, (_, res) => {
      if (this.errorCount >= 2) {
        res.status(200).send(SUCCESS_JSON_RESPONSE)
      } else {
        this.errorCount += 1
        res.status(500).send(ERROR_RESPONSE)
      }
    })

    app.get(`/${ERROR_CUSTOM_PATH}`, (_, res) => {
      this.errorCount++
      res.status(200).send(ERROR_CUSTOM_RESPONSE)
    })

    app.get(`/${ERROR_PATH_V2}`, (_, res) => {
      this.errorCount++
      res.status(ERROR_RESPONSE_V2.statusCode).send(ERROR_RESPONSE_V2)
    })

    app.get(`/${ERROR_PATH_V3}`, (_, res) => {
      this.errorCount++
      res.status(ERROR_RESPONSE_V3.statusCode).send(ERROR_RESPONSE_V3)
    })

    app.listen({ port: this.port, host: '::' })
    this.app = app
  }

  stop(callback?: (err?: Error | undefined) => void): void {
    if (this.app) this.app.close(callback as () => void)
  }

  reset(): void {
    this.errorCount = 0
  }

  getBaseURL(): string {
    return `http://localhost:${this.port}`
  }

  getExpectedResponse(endpoint: Endpoint): (typeof responseLookup)[keyof typeof responseLookup] {
    return responseLookup[endpoint as keyof typeof responseLookup]
  }
}
