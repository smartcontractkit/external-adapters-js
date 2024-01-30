import { ExtendedConfig, makeConfig, Networks } from '../../src/config'
import * as network from '../../src/network'
import * as starkware from '../../src/starkware'

describe('network', () => {
  let config: ExtendedConfig

  beforeEach(async () => {
    config = makeConfig()
  })

  describe('#getStatusByTransaction', () => {
    describe('when fetching Starkware Sequencer status', () => {
      describe('when dummy contract initialized', () => {
        it('returns true', async () => {
          jest.spyOn(starkware, 'sendDummyStarkwareTransaction').mockRejectedValue({
            errorCode:
              'RPC: starknet_addInvokeTransaction with params {"invoke_transaction":{"sender_address":"0x009cf509ef7a55ee8e487787003d47a704b4c7b6cc5469d7cd319d27bd753566","calldata":["0x1","0x9cf509ef7a55ee8e487787003d47a704b4c7b6cc5469d7cd319d27bd753566","0x79dc0da7c54b95f10aa182ad0a46400db63156920adb65eca2654c0945a463","0x2","0x1ef15c18599971b7beced415a40f0c7deacfd9b0d1819e03d723d8bc943cfca","0x0"],"type":"INVOKE","max_fee":"0x0","version":"0x1","signature":["0x1034048c548de23a36d5da5ba0f8fa125d1cede29f7ffa166680aee25165cc","0x7ccd1ffdf427cfa2e4e760c58455e5dcecc7246ef2fd8d3b0c095ddb69a849f"],"nonce":"0x3"}}\n An unexpected error occurred: {"error":"StarknetError { code: Known(OutOfRangeFee), message: "Transaction must commit to pay a positive amount on fee." }"}',
          })
          expect(await network.getStatusByTransaction(Networks.Starkware, config)).toBe(true)
        })
      })

      describe('when dummy contract not initialized', () => {
        it('returns true', async () => {
          jest.spyOn(starkware, 'sendDummyStarkwareTransaction').mockRejectedValue({
            errorCode:
              'RPC: starknet_getNonce with params {"contract_address":"0x1","block_id":"pending"}\n 20: Contract not found: undefined',
          })
          expect(await network.getStatusByTransaction(Networks.Starkware, config)).toBe(true)
        })
      })

      describe('when transaction fails with unexpected error', () => {
        it('returns false', async () => {
          jest.spyOn(starkware, 'sendDummyStarkwareTransaction').mockRejectedValue({
            errorCode: 'Unexpected error',
          })
          expect(await network.getStatusByTransaction(Networks.Starkware, config)).toBe(false)
        })
      })
    })

    /**
     * TO_BE_IMPLEMENTED
     *  describe('when fetching EVM Sequencer status', () => {})
     *  */
  })
})
