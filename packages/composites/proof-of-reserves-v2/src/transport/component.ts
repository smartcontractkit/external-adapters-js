import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, RequestParams } from '../endpoint/reserves'
import { FixedPoint, add, fixedPointToNumber, toFixedPointWithDecimals } from '../utils/fixed-point'
import { AddressListRepo } from './address'
import { BalanceSourceRepo } from './balance'
import { ConversionRepo } from './conversion'
import { ProcessedComponent } from './types'

type ComponentConfig = RequestParams['components'][number]
type ComponentForResponse = BaseEndpointTypes['Response']['Data']['components'][number]

export class Component {
  config: ComponentConfig
  addressListRepo: AddressListRepo
  balanceSourceRepo: BalanceSourceRepo
  conversionRepo: ConversionRepo

  processedComponent: Promise<ProcessedComponent>

  constructor({
    config,
    addressListRepo,
    balanceSourceRepo,
    conversionRepo,
  }: {
    config: ComponentConfig
    addressListRepo: AddressListRepo
    balanceSourceRepo: BalanceSourceRepo
    conversionRepo: ConversionRepo
  }) {
    this.config = config
    this.addressListRepo = addressListRepo
    this.balanceSourceRepo = balanceSourceRepo
    this.conversionRepo = conversionRepo

    this.processedComponent = this._processComponent()
  }

  get name(): string {
    return this.config.name
  }

  get originalCurrency(): string {
    return this.config.currency
  }

  async _processComponent(): Promise<ProcessedComponent> {
    const component = this.config

    try {
      const addressArray = await this.addressListRepo.getAddressArray(component.addressList)

      const { balances, addressCount } = await this.balanceSourceRepo.fetchBalances(
        component.balanceSource,
        addressArray,
      )

      const totalBalance = balances.reduce((acc, balance) => add(acc, balance), {
        amount: 0n,
        decimals: 0,
      })

      const processedComponent: ProcessedComponent = {
        name: component.name,
        currency: component.currency,
        totalBalance,
        originalCurrency: component.currency,
        totalBalanceInOriginalCurrency: totalBalance,
        addressCount,
      }

      await this.conversionRepo.applyConversions(component.conversions, processedComponent)

      return processedComponent
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const statusCode = error instanceof AdapterError ? error.statusCode : 500
      throw new AdapterError({
        statusCode,
        message: `Error processing component '${component.name}': ${errorMessage}`,
      })
    }
  }

  async getTotalBalance(): Promise<FixedPoint> {
    return (await this.processedComponent).totalBalance
  }

  async getAddressCount(): Promise<number | undefined> {
    return (await this.processedComponent).addressCount
  }

  async getCurrency(): Promise<string> {
    return (await this.processedComponent).currency
  }

  async getTotalBalanceInOriginalCurrency(): Promise<FixedPoint> {
    return (await this.processedComponent).totalBalanceInOriginalCurrency
  }

  async forResponse(): Promise<ComponentForResponse> {
    const currency = await this.getCurrency()
    const componentForResponse: BaseEndpointTypes['Response']['Data']['components'][number] = {
      name: this.name,
      currency: currency,
      totalBalance: fixedPointToNumber(await this.getTotalBalance()),
      addressCount: await this.getAddressCount(),
    }
    const originalCurrency = this.originalCurrency
    if (originalCurrency !== currency) {
      const totalBalanceInOriginalCurrency = await this.getTotalBalanceInOriginalCurrency()
      componentForResponse.originalCurrency = originalCurrency
      componentForResponse.totalBalanceInOriginalCurrency = {
        amount: totalBalanceInOriginalCurrency.amount.toString(),
        decimals: totalBalanceInOriginalCurrency.decimals,
      }
    }
    return componentForResponse
  }
}

export class ComponentRepo {
  components: Component[]

  constructor({
    config,
    addressListRepo,
    balanceSourceRepo,
    conversionRepo,
  }: {
    config: ComponentConfig[]
    addressListRepo: AddressListRepo
    balanceSourceRepo: BalanceSourceRepo
    conversionRepo: ConversionRepo
  }) {
    this.components = config.map(
      (componentConfig) =>
        new Component({
          config: componentConfig,
          addressListRepo,
          balanceSourceRepo,
          conversionRepo,
        }),
    )
  }

  async getTotalReserves(resultDecimals: number): Promise<FixedPoint> {
    return toFixedPointWithDecimals(
      (await Promise.all(this.components.map((c) => c.getTotalBalance()))).reduce(
        (acc, totalBalance) => add(acc, totalBalance),
        {
          amount: 0n,
          decimals: 0,
        },
      ),
      resultDecimals,
    )
  }

  async forResponse(): Promise<ComponentForResponse[]> {
    return Promise.all(this.components.map((c) => c.forResponse()))
  }
}
