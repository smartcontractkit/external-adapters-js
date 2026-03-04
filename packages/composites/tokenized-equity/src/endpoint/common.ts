import { BaseEndpointTypes as DataEngineResponse } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

export const inputExample = {
  asset: '0x0',
  regularStreamId: '0x0',
  extendedStreamId: '0x0',
  overnightStreamId: '0x0',
  sessionMarket: 'nyse',
  sessionMarketType: '24/5',
  sessionBoundaries: ['04:00', '16:00', '20:00'],
  sessionBoundariesTimeZone: 'America/New_York',
  smoother: 'kalman' as const,
  decimals: 8,
}

export const inputDefinition = new InputParameters(
  {
    asset: {
      required: true,
      type: 'string',
      description:
        'Unique identifier of the underlying asset. Used to maintain smoother internal state.',
    },
    regularStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams regular hour feed ID for the underlying asset',
    },
    extendedStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams extended hour feed ID for the underlying asset',
    },
    overnightStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams overnight hour feed ID for the underlying asset',
    },
    sessionMarket: {
      required: true,
      type: 'string',
      description:
        'The name of the market for session times, for example nyse. This is passed to the tradinghours adapter as the `market` parameter.',
    },
    sessionMarketType: {
      required: true,
      type: 'string',
      description:
        'The type of the market for session times, for example 24/5. This is passed to the tradinghours adapter as the `type` parameter.',
    },
    sessionBoundaries: {
      required: true,
      type: 'string',
      array: true,
      description:
        '(backup) A list of time where market trasition from 1 session to the next in the format of HH:MM. This is only used when the adapter is unable to fetch session times from the tradinghours EA',
    },
    sessionBoundariesTimeZone: {
      required: true,
      type: 'string',
      description: 'ANA Time Zone Database format',
    },
    smoother: {
      type: 'string',
      description: 'Smoothing algorithm to apply to the price',
      options: ['kalman', 'ema'],
      default: 'kalman',
    },
    decimals: {
      type: 'number',
      description: 'Decimals of output result',
      default: 8,
    },
  },
  [inputExample],
)

export type Smoother = TypeFromDefinition<typeof inputDefinition.definition>['smoother']

export const validateSession = (sessionBoundaries: string[], sessionBoundariesTimeZone: string) => {
  sessionBoundaries.forEach((s) => {
    if (!s.match(/^(?:[01]\d|2[0-3]):[0-5]\d$/)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `${s} in [Param: sessionBoundaries] does not match format HH:MM`,
      })
    }
  })

  try {
    // eslint-disable-next-line new-cap
    Intl.DateTimeFormat(undefined, { timeZone: sessionBoundariesTimeZone })
  } catch (error) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `[Param: sessionBoundariesTimeZone] is not valid timezone: ${error}`,
    })
  }
  return
}

export type output = {
  result: string
  decimals: number
  rawPrice: string
  stream: {
    regular: DataEngineResponse['Response']['Data']
    extended: DataEngineResponse['Response']['Data']
    overnight: DataEngineResponse['Response']['Data']
  }
  smoother: {
    price: string
    x: string
    p: string
    secondsFromTransition: number
  }
  sessionSource: 'TRADINGHOURS' | 'FALLBACK'
}
