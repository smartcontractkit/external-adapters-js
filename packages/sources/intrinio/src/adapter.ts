import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type {
  AdapterRequest,
  AdapterResponse,
  ExecuteFactory,
  ExecuteWithConfig,
  Config,
  InputParameters,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { IntrinioRealtime } from './util'
import { makeConfig, NAME } from './config'

export type TInputParameters = { base: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'asset'],
    required: true,
    description: 'The symbol of the asset to query',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (
  input: AdapterRequest,
  _,
  config: Config,
) => {
  const validator = new Validator<TInputParameters>(input, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base.toUpperCase()

  const url = util.buildUrlPath('securities/:symbol/prices/realtime', { symbol })
  const params = {
    api_key: config.apiKey,
  }

  const request = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<Record<string, unknown>>(request)
  response.data.result = Requester.validateResultNumber(response.data, ['last_price'])

  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config?: Config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  // https://github.com/intrinio/intrinio-realtime-node-sdk

  const getBase = (input: AdapterRequest): string => {
    const validator = new Validator(input, inputParameters, {}, { shouldThrowError: false })
    if (validator.error) {
      return ''
    }
    return validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase()
  }

  return async () => {
    const defaultConfig = config || makeConfig()
    const ws = new IntrinioRealtime({
      api_key: defaultConfig.apiKey,
      provider: 'iex',
    })
    return {
      connection: {
        getUrl: ws._makeSocketUrl.bind(ws),
      },
      subscribe: (input) => ws._makeJoinMessage(getBase(input)) as any,
      unsubscribe: (input) => ws._makeLeaveMessage(getBase(input)) as any,
      subsFromMessage: (message: any) => ws._makeJoinMessage(message.payload.ticker) as any,
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: (message: any) => message.event == 'quote' && message.payload?.type == 'last',
      toResponse: (wsResponse: any): AdapterResponse => {
        return Requester.success(undefined, { data: { result: wsResponse?.payload?.price } })
      },

      heartbeatIntervalInMS: 3000, // Same as the one from the Intrinio WS SDK
      heartbeatMessage: () => ws._makeHeartbeatMessage() as any,
    }
  }
}
