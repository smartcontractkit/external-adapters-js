import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import BN from 'bn.js'
import * as adrenaProgramIdl from '../../src/idl/adrena.json'
import * as flashTradeProgramIdl from '../../src/idl/flash_trade.json'
import { getAnchorData } from '../../src/shared/anchor-data'
import * as adrenaAccountData from '../fixtures/adrena-account-data-2025-10-08.json'
import * as flashTradeAccountData from '../fixtures/flash-trade-account-data-2025-10-08.json'
import * as fragmetricAccountData from '../fixtures/fragmetric-account-data-2025-10-06.json'

const getAccountInfoRequest = makeStub('getAccountInfoRequest', {
  send: jest.fn(),
})

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: () => getAccountInfoRequest,
} as unknown as Rpc<SolanaRpcApi>)

// BNs that represent equal value can look different to Jest because of
// internal padding. This function creates the BN value from a buffer, which is
// what the BorshAccountsCoder does, so that the values are equal to Jest.
const createBnFromBuffer = (s: string) => new BN(new BN(s).toArrayLike(Buffer, 'le', 8), 'le')

const setDataField = async ({
  base64Data,
  idl,
  account,
  field,
  newValue,
}: {
  base64Data: string
  idl: Idl
  account: string
  field: string
  newValue: unknown
}): Promise<string> => {
  const binaryData = Buffer.from(base64Data, 'base64')
  const coder = new BorshAccountsCoder(idl)
  const decodedData = coder.decode(account, binaryData)
  decodedData[field] = newValue
  const newBinaryData = await coder.encode(account, decodedData)
  return newBinaryData.toString('base64')
}

describe('AnchorDataTransport', () => {
  const fragmetricAccountAddress = '3TK9fNePM4qdKC4dwvDe8Bamv14prDqdVfuANxPeiryb'
  const fragmetricLiquidStakingProgramAddress = 'fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3'
  const adrenaAccountAddress = '4bQRutgDJs6vuh6ZcWaPVXiQaBzbHketjbCDjL4oRN34'
  const flashTradeAccountAddress = 'HfF7GCcEc76xubFCHLLXRdYcgRzwjEPdfKWqzRS8Ncog'
  const expectedFragmetricTokenPrice = '1079420719'

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()
  })

  describe('getAnchorData', () => {
    it('should return fragmetric token price', async () => {
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: fragmetricLiquidStakingProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const fieldName = 'one_receipt_token_as_sol'
      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        fields: [fieldName],
      })

      const response = await getAnchorData(param)

      expect(response).toEqual({
        [fieldName]: createBnFromBuffer(expectedFragmetricTokenPrice),
      })
    })

    it('should return fragmetric token supply', async () => {
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: fragmetricLiquidStakingProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const fieldName = 'receipt_token_supply_amount'
      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        fields: [fieldName],
      })

      const response = await getAnchorData(param)

      const expectedTokenSupply = '316994539554695'

      expect(response).toEqual({
        [fieldName]: createBnFromBuffer(expectedTokenSupply),
      })
    })

    it('should return multiple values', async () => {
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: fragmetricLiquidStakingProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const fieldName1 = 'one_receipt_token_as_sol'
      const fieldName2 = 'receipt_token_supply_amount'
      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        fields: [fieldName1, fieldName2],
      })

      const response = await getAnchorData(param)

      const expectedTokenSupply = '316994539554695'

      expect(response).toEqual({
        [fieldName1]: createBnFromBuffer(expectedFragmetricTokenPrice),
        [fieldName2]: createBnFromBuffer(expectedTokenSupply),
      })
    })

    it('should throw if account does not have an owner', async () => {
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: undefined,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        fields: ['receipt_token_supply_amount'],
      })

      await expect(() => getAnchorData(param)).rejects.toThrow(
        `No program address found for state account '${fragmetricAccountAddress}'`,
      )
    })

    it('should throw if account has an unknown owner', async () => {
      const programAddress = 'unknown-program-123'
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: programAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        fields: ['receipt_token_supply_amount'],
      })

      await expect(() => getAnchorData(param)).rejects.toThrow(
        `No IDL known for program address '${programAddress}'`,
      )
    })

    it('should return adrena token price', async () => {
      const expectedTokenPrice = '98765432123'
      const priceField = 'lp_token_price_usd'
      const base64Data = await setDataField({
        base64Data: adrenaAccountData.result.value.data[0] as string,
        idl: adrenaProgramIdl as unknown as Idl,
        account: 'Pool',
        field: priceField,
        newValue: new BN(expectedTokenPrice),
      })

      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: adrenaAccountData.result.value.owner,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: adrenaAccountAddress,
        account: 'Pool',
        fields: [priceField],
      })

      const response = await getAnchorData(param)

      expect(response).toEqual({
        [priceField]: createBnFromBuffer(expectedTokenPrice),
      })
    })

    it('should return flash trade token price', async () => {
      const expectedTokenPrice = '12345654321'
      const priceField = 'compounding_lp_price'
      const base64Data = await setDataField({
        base64Data: flashTradeAccountData.result.value.data[0] as string,
        idl: flashTradeProgramIdl as unknown as Idl,
        account: 'Pool',
        field: priceField,
        newValue: new BN(expectedTokenPrice),
      })

      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: flashTradeAccountData.result.value.owner,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: flashTradeAccountAddress,
        account: 'Pool',
        fields: [priceField],
      })

      const response = await getAnchorData(param)

      expect(response).toEqual({
        [priceField]: createBnFromBuffer(expectedTokenPrice),
      })
    })

    it('should throw if account does not have the given field', async () => {
      const accountDataResponse = makeStub('accountDataResponse', adrenaAccountData.result)

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        rpc: solanaRpc,
        stateAccountAddress: adrenaAccountAddress,
        account: 'Pool',
        fields: ['unknown_field_123'],
      })

      await expect(() => getAnchorData(param)).rejects.toThrow(
        `No field 'unknown_field_123' in IDL for program with address '13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet'. Available fields are: bump, lp_token_bump, nb_stable_custody, initialized, allow_trade, allow_swap, liquidity_state, registered_custody_count, name, custodies, fees_debt_usd, referrers_fee_debt_usd, cumulative_referrer_fee_usd, lp_token_price_usd, whitelisted_swapper, ratios, last_aum_and_lp_token_price_usd_update, unique_limit_order_id_counter, aum_usd, inception_time, aum_soft_cap_usd`,
      )
    })
  })
})
