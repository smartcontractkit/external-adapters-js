import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { config } from '../config'
import { BaseEndpointTypes, inputParameters } from '../endpoint/market-status'
import {
  getMarketStatusFromSchedule,
  MarketStatusResult,
  MarketStatusType,
  Schedule,
} from '../util/schedule'

export type CustomTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

export class CustomTransport implements Transport<CustomTransportTypes> {
  name!: string
  responseCache!: ResponseCache<CustomTransportTypes>
  requester!: Requester
  regularSchedules = new Map<string, Schedule<typeof MarketStatus>>()
  twentyfourFiveSchedules = new Map<string, Schedule<typeof TwentyfourFiveMarketStatus>>()

  async initialize(
    _dependencies: TransportDependencies<CustomTransportTypes>,
    _adapterSettings: CustomTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.name = transportName
  }

  async foregroundExecute(
    request: AdapterRequest<typeof inputParameters.validated>,
    settings: typeof config.settings,
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {
    const params = request.requestContext.data
    const atTimestampMillis = params.atTimestampSeconds
      ? params.atTimestampSeconds * 1000
      : Date.now()

    const statusResult = this.getStatusResult(
      params.market,
      atTimestampMillis,
      settings,
      this.getMarketStatusType(params.type),
    )

    const result = statusResult.result
    return {
      data: statusResult,
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getMarketStatusType(type: string): MarketStatusType {
    switch (type) {
      case 'regular':
        return MarketStatus
      case '24/5':
        return TwentyfourFiveMarketStatus
    }
    throw new Error(`Invalid market status type: ${type}`)
  }

  getStatusResult<StatusType extends MarketStatusType>(
    market: string,
    atTimestampMillis: number,
    settings: typeof config.settings,
    usedMarketStatusType: StatusType,
  ): MarketStatusResult<StatusType> {
    const scheduleData = this.getScheduleData(market, settings, usedMarketStatusType)
    return getMarketStatusFromSchedule(atTimestampMillis, scheduleData, usedMarketStatusType)
  }

  getScheduleData<StatusType extends MarketStatusType>(
    market: string,
    settings: typeof config.settings,
    usedMarketStatusType: StatusType,
  ): Schedule<StatusType> {
    const schedulesMap = this.getSchedulesMap(usedMarketStatusType)

    let scheduleData = schedulesMap.get(market)
    if (!scheduleData) {
      const scheduleString = this.getScheduleSettings(market, usedMarketStatusType, settings)
      scheduleData = JSON.parse(scheduleString) as Schedule<StatusType>
      schedulesMap.set(market, scheduleData)
    }
    return scheduleData
  }

  getSchedulesMap<StatusType extends MarketStatusType>(
    usedMarketStatusType: StatusType,
  ): Map<string, Schedule<StatusType>> {
    switch (usedMarketStatusType) {
      case MarketStatus:
        return this.regularSchedules as Map<string, Schedule<StatusType>>
      case TwentyfourFiveMarketStatus:
        return this.twentyfourFiveSchedules as Map<string, Schedule<StatusType>>
    }
    throw new Error(`Invalid market status type: ${JSON.stringify(usedMarketStatusType)}`)
  }

  getScheduleSettings(
    market: string,
    usedMarketStatusType: MarketStatusType,
    settings: typeof config.settings,
  ): string {
    switch (usedMarketStatusType) {
      case MarketStatus:
        return settings.MARKET_REGULAR_SCHEDULE.get(market)
      case TwentyfourFiveMarketStatus:
        return settings.MARKET_24_5_SCHEDULE.get(market)
    }
    throw new Error(`Invalid market status type: ${JSON.stringify(usedMarketStatusType)}`)
  }
}

export const customTransport = new CustomTransport()
