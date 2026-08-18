import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { getScheduleValidationError } from '../util/schedule'

export const config = new AdapterConfig({
  MARKET_REGULAR_SCHEDULE: {
    description:
      'JSON encoded schedule data for ${MARKET} which is specified in the input parameter',
    type: 'string',
    required: true,
    sensitive: true,
    variablePlaceholder: 'MARKET',
    validate: {
      meta: {},
      fn: (value) => getScheduleValidationError(value!, MarketStatus),
    },
  },
  MARKET_24_5_SCHEDULE: {
    description:
      'JSON encoded schedule data for ${MARKET} which is specified in the input parameter, when type = "24/5"',
    type: 'string',
    required: true,
    sensitive: true,
    variablePlaceholder: 'MARKET',
    validate: {
      meta: {},
      fn: (value) => getScheduleValidationError(value!, TwentyfourFiveMarketStatus),
    },
  },
})
