import { AbiCoder } from 'ethers'
import { RequestParams } from '../../src/endpoint/calculated-multi-function'
import { evaluateOperation, validateOperations } from '../../src/utils/operations'

describe('operations', () => {
  describe('validateOperations', () => {
    it('should validate that used names exist', () => {
      expect(() => {
        validateOperations({
          functionCalls: [],
          constants: [],
          operations: [
            {
              name: 'product',
              type: 'multiply',
              args: ['a', 'b'],
            },
          ],
        })
      }).toThrowError('"a" must be defined before "product"')
    })

    it('should validate that names are defined before used', () => {
      expect(() => {
        validateOperations({
          functionCalls: [],
          constants: [
            {
              name: 'a',
              value: '10',
            },
          ],
          operations: [
            {
              name: 'aCubed',
              type: 'multiply',
              args: ['a', 'aSquared'],
            },
            {
              name: 'aSquared',
              type: 'multiply',
              args: ['a', 'a'],
            },
          ],
        })
      }).toThrowError('"aSquared" must be defined before "aCubed"')
    })

    it('should validate that select operations have 2 args', () => {
      expect(() => {
        validateOperations({
          functionCalls: [
            {
              name: 'price',
              address: '0x56f40A33e3a3fE2F1614bf82CBeb35987ac10194',
              network: 'ethereum',
              signature: 'function price() external view returns (uint192 low, uint192 high)',
              inputParams: [],
            },
          ],
          constants: [],
          operations: [
            {
              name: 'highPrice',
              type: 'select',
              args: ['price', 'tuple(uint192 low, uint192 high)', 'low'],
            },
          ],
        })
      }).toThrowError('Select operation "highPrice" must have 2 arguments')
    })

    it('should validate that select operations have defined arg', () => {
      expect(() => {
        validateOperations({
          functionCalls: [
            {
              name: 'value',
              address: '0x56f40A33e3a3fE2F1614bf82CBeb35987ac10194',
              network: 'ethereum',
              signature: 'function price() external view returns (uint192 low, uint192 high)',
              inputParams: [],
            },
          ],
          constants: [],
          operations: [
            {
              name: 'highPrice',
              type: 'select',
              args: ['price', 'high'],
            },
          ],
        })
      }).toThrowError('Select operation "highPrice" references undefined function call "price"')
    })

    it('should validate valid select operation', () => {
      validateOperations({
        functionCalls: [
          {
            name: 'price',
            address: '0x56f40A33e3a3fE2F1614bf82CBeb35987ac10194',
            network: 'ethereum',
            signature: 'function price() external view returns (uint192 low, uint192 high)',
            inputParams: [],
          },
        ],
        constants: [],
        operations: [
          {
            name: 'highPrice',
            type: 'select',
            args: ['price', 'high'],
          },
        ],
      })
    })

    it('should validate that multiply operation has at least 2 args', () => {
      expect(() => {
        validateOperations({
          functionCalls: [],
          constants: [
            {
              name: 'a',
              value: '1000000',
            },
            {
              name: 'b',
              value: '1000',
            },
          ],
          operations: [
            {
              name: 'result',
              type: 'multiply',
              args: ['a'],
            },
          ],
        })
      }).toThrowError('Multiply operation "result" must have at least 2 arguments')
    })

    it('should validate valid multiply operation', () => {
      validateOperations({
        functionCalls: [],
        constants: [
          {
            name: 'a',
            value: '1000000',
          },
          {
            name: 'b',
            value: '1000',
          },
        ],
        operations: [
          {
            name: 'result',
            type: 'multiply',
            args: ['a', 'b'],
          },
        ],
      })
    })

    it('should validate that divide operation has 2 args', () => {
      expect(() => {
        validateOperations({
          functionCalls: [
            {
              name: 'totalSupply',
              address: '0xE72B141DF173b999AE7c1aDcbF60Cc9833Ce56a8',
              network: 'ethereum',
              signature: 'function totalSupply() external view returns (uint256)',
              inputParams: [],
            },
          ],
          constants: [
            {
              name: 'scale',
              value: '1000000',
            },
          ],
          operations: [
            {
              name: 'result',
              type: 'divide',
              args: ['totalSupply', 'scale', 'scale'],
            },
          ],
        })
      }).toThrowError('Divide operation "result" must have 2 arguments')
    })

    it('should validate valid divide operations', () => {
      validateOperations({
        functionCalls: [
          {
            name: 'totalSupply',
            address: '0xE72B141DF173b999AE7c1aDcbF60Cc9833Ce56a8',
            network: 'ethereum',
            signature: 'function totalSupply() external view returns (uint256)',
            inputParams: [],
          },
        ],
        constants: [
          {
            name: 'scale',
            value: '1000000',
          },
        ],
        operations: [
          {
            name: 'result',
            type: 'divide',
            args: ['totalSupply', 'scale'],
          },
        ],
      })
    })

    it('should validate that add operation has at least 2 args', () => {
      expect(() => {
        validateOperations({
          functionCalls: [],
          constants: [
            {
              name: 'a',
              value: '1000000',
            },
            {
              name: 'b',
              value: '1000',
            },
          ],
          operations: [
            {
              name: 'result',
              type: 'add',
              args: ['a'],
            },
          ],
        })
      }).toThrowError('Add operation "result" must have at least 2 arguments')
    })

    it('should validate valid add operation', () => {
      validateOperations({
        functionCalls: [],
        constants: [
          {
            name: 'a',
            value: '1000000',
          },
          {
            name: 'b',
            value: '1000',
          },
        ],
        operations: [
          {
            name: 'result',
            type: 'add',
            args: ['a', 'b'],
          },
        ],
      })
    })

    it('should validate that subtract operation has 2 args', () => {
      expect(() => {
        validateOperations({
          functionCalls: [],
          constants: [
            {
              name: 'a',
              value: '1000000',
            },
            {
              name: 'b',
              value: '1000',
            },
          ],
          operations: [
            {
              name: 'result',
              type: 'subtract',
              args: ['a'],
            },
          ],
        })
      }).toThrowError('Subtract operation "result" must have 2 arguments')
    })

    it('should validate valid subtract operation', () => {
      validateOperations({
        functionCalls: [],
        constants: [
          {
            name: 'a',
            value: '1000000',
          },
          {
            name: 'b',
            value: '1000',
          },
        ],
        operations: [
          {
            name: 'result',
            type: 'subtract',
            args: ['a', 'b'],
          },
        ],
      })
    })

    it('should validate that average operation has at least 2 args', () => {
      expect(() => {
        validateOperations({
          functionCalls: [],
          constants: [
            {
              name: 'a',
              value: '1000000',
            },
            {
              name: 'b',
              value: '1000',
            },
          ],
          operations: [
            {
              name: 'result',
              type: 'average',
              args: ['a'],
            },
          ],
        })
      }).toThrowError('Average operation "result" must have at least 2 arguments')
    })

    it('should validate valid average operation', () => {
      validateOperations({
        functionCalls: [],
        constants: [
          {
            name: 'a',
            value: '1000000',
          },
          {
            name: 'b',
            value: '1000',
          },
        ],
        operations: [
          {
            name: 'result',
            type: 'average',
            args: ['a', 'b'],
          },
        ],
      })
    })
  })

  describe('evaluateOperation', () => {
    it('should evaluate select operation', () => {
      const low = 123456n
      const high = 654321n
      const abiType = 'tuple(uint192 low, uint192 high)'
      const encoded = AbiCoder.defaultAbiCoder().encode([abiType], [[low, high]])
      const result = evaluateOperation(
        'select',
        ['encoded', 'high'],
        { encoded },
        {
          functionCalls: [
            {
              name: 'encoded',
              address: '0x56f40A33e3a3fE2F1614bf82CBeb35987ac10194',
              network: 'ethereum',
              signature: 'function price() external view returns (uint192 low, uint192 high)',
              inputParams: [],
            },
          ],
          constants: [],
          operations: [
            {
              name: 'highPrice',
              type: 'select',
              args: ['encoded', 'high'],
            },
          ],
        },
      )
      expect(result).toEqual(high.toString())
    })

    it('should evaluate multiply operation', () => {
      const data = {
        a: '2',
        b: '3',
        c: '5',
      }
      const result = evaluateOperation('multiply', ['a', 'b', 'c'], data, {} as RequestParams)
      expect(result).toEqual('30')
    })

    it('should evaluate divide operation', () => {
      const data = {
        a: '100',
        b: '3',
      }
      const result = evaluateOperation('divide', ['a', 'b'], data, {} as RequestParams)
      expect(result).toEqual('33')
    })

    it('should evaluate add operation', () => {
      const data = {
        a: '2',
        b: '3',
        c: '5',
      }
      const result = evaluateOperation('add', ['a', 'b', 'c'], data, {} as RequestParams)
      expect(result).toEqual('10')
    })

    it('should evaluate subtract operation', () => {
      const data = {
        a: '10',
        b: '3',
      }
      const result = evaluateOperation('subtract', ['a', 'b'], data, {} as RequestParams)
      expect(result).toEqual('7')
    })

    it('should evaluate average operation', () => {
      const data = {
        a: '100',
        b: '10',
      }
      const result = evaluateOperation('average', ['a', 'b'], data, {} as RequestParams)
      expect(result).toEqual('55')
    })
  })
})
