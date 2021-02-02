import { assert } from 'chai'
import { convertAddressToScriptHash } from '../src/nodes/electrs'

describe('convertAddressToScriptHash', () => {
  context('successful calls', () => {
    it('should generate correct reversed sha256 hash of P2PKH', async () => {
      const res = convertAddressToScriptHash('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
      const expect = '8b01df4e368ea28f8dc0423bcf7a4923e3a12d307c875e47a0cfbf90b5c39161'
      assert.equal(res, expect)
    })
  })
})
