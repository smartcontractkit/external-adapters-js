import { InputParameters } from '@chainlink/types'
import { Validator } from '../../src/lib/modules/validator'

describe('Validator', () => {
  describe('with no input parameter configuration', () => {
    it('does not error if no input and no input parameters', () => {
      const validator = new Validator()
      expect(validator.validated.id).toEqual('1')
      expect(validator.error).not.toBeDefined()
    })

    it('does not error when input is empty', () => {
      const validator = new Validator({})
      expect(validator.validated.id).toEqual('1')
      expect(validator.error).not.toBeDefined()
    })

    it('does not error if input data is excluded', () => {
      const input = { id: '1' }

      const validator = new Validator(input)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.error).not.toBeDefined()
    })
  })

  describe('with optional params', () => {
    const inputParameters: InputParameters = {
      endpoint: false,
    }

    it('does not error if optional params are included', () => {
      const input = {
        id: '1',
        data: {
          endpoint: 'test',
        },
      }

      const validator = new Validator(input, inputParameters)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.validated.data.endpoint).toEqual(input.data.endpoint)
      expect(validator.error).not.toBeDefined()
    })
  })

  describe('with required params', () => {
    const params = {
      keys: ['one', 'two'],
      endpoint: true,
    }

    it('errors if no input is provided', () => {
      try {
        expect.hasAssertions()
        const input = {}
        new Validator(input, params, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('Required parameter not supplied: endpoint')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if empty string is provided', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            endpoint: '',
          },
        }
        new Validator(input, params, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('Required parameter not supplied: endpoint')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if an array param is not provided', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            endpoint: 'test',
          },
        }
        new Validator(input, params, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('None of aliases used for required key keys')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if a boolean param is not provided', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            one: 'test',
          },
        }
        new Validator(input, params, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('Required parameter not supplied: endpoint')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('does not error if required params are included', () => {
      const input = {
        id: '1',
        data: {
          endpoint: 'test',
          one: 'test',
        },
      }
      const validator = new Validator(input, params)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.validated.data.endpoint).toEqual(input.data.endpoint)
      expect(validator.validated.data.keys).toEqual(input.data.one)
      expect(validator.error).not.toBeDefined()
    })
  })

  describe('with complex input configs', () => {
    const inputConfig: InputParameters = {
      key1: {
        aliases: ['keyA'],
        description: 'First key',
        required: true,
        type: 'string',
      },
      key2: {
        aliases: ['keyB'],
        description: 'Second key',
        required: true,
        type: 'string',
      },
      source: {
        aliases: ['origin'],
        description: 'Source of data',
        type: 'string',
        default: 'DataSource1',
      },
      limit: {
        type: 'number',
        aliases: ['end'],
      },
      page: {
        type: 'number',
        dependsOn: ['limit'],
      },
      indexes: {
        type: 'array',
        exclusive: ['limit', 'page'],
      },
      verbose: {
        type: 'boolean',
        default: false,
      },
      valueObject: {
        type: 'object',
      },
      bigInt: {
        type: 'bigint',
        options: [0n, 1n, 2n],
      },
    }

    it('accepts input when all required params are present', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
        },
      }

      const validatedData = {
        key1: 'A',
        key2: 'B',
        source: 'DataSource1',
        limit: undefined,
        page: undefined,
        indexes: undefined,
        verbose: false,
      }

      const validator = new Validator(input, inputConfig)
      expect(validator.validated.data).toEqual(validatedData)
    })

    it('accepts input when aliases are used', () => {
      const input = {
        id: '1',
        data: {
          keyA: 'A',
          keyB: 'B',
          end: 1,
          page: 0,
          origin: 'DataSource2',
        },
      }

      const validatedData = {
        key1: 'A',
        key2: 'B',
        source: 'DataSource2',
        limit: 1,
        page: 0,
        indexes: undefined,
        verbose: false,
        bigInt: undefined,
        valueObject: undefined,
      }

      const validator = new Validator(input, inputConfig)
      expect(validator.validated.data).toEqual(validatedData)
    })

    it('accepts input when non-required params are present', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          indexes: [0, 1, 2],
          verbose: true,
          bigInt: BigInt(2),
        },
      }

      const validatedData = {
        key1: 'A',
        key2: 'B',
        source: 'DataSource1',
        limit: undefined,
        page: undefined,
        indexes: [0, 1, 2],
        verbose: true,
        bigInt: 2n,
        valueObject: undefined,
      }

      const validator = new Validator(input, inputConfig)
      expect(validator.validated.data).toEqual(validatedData)
    })

    it('errors if required params are missing', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('Required parameter key2 must be non-null and non-empty')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if dependent params are missing', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            page: 3,
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('page dependency limit not supplied')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if exclusive params are present', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            page: 3,
            limit: 5,
            indexes: [0, 1],
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('indexes cannot be supplied concurrently with limit')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if param does not have required string type', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 1,
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('key2 parameter must be of type string')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if param does not have required boolean type', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            verbose: 'yes',
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('verbose parameter must be of type boolean')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if param does not have required array type', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            indexes: '1, 2, 3',
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('indexes parameter must be a non-empty array')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if param does not have required object type', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            valueObject: [1, 2, 3],
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual(
          'valueObject parameter must be an object with at least one property',
        )
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if param does not have required number type', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            limit: 'limit',
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('limit parameter must be of type number')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if param does not have required bigint type', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            bigInt: 3,
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual('bigInt parameter must be of type bigint')
        expect(error?.cause).toEqual(undefined)
      }
    })

    it('errors if param does not use element of options', () => {
      try {
        expect.hasAssertions()
        const input = {
          id: '1',
          data: {
            key1: 'A',
            key2: 'B',
            bigInt: BigInt(123),
          },
        }
        new Validator(input, inputConfig, {})
      } catch (error) {
        expect(error?.jobRunID).toEqual('1')
        expect(error?.statusCode).toEqual(400)
        expect(error?.message).toEqual(
          "bigInt parameter '123' is not in the set of available options: 0,1,2",
        )
        expect(error?.cause).toEqual(undefined)
      }
    })
  })

  it('accepts input without customParams', () => {
    const input = {
      id: '1',
      data: {
        endpoint: 'test',
        one: 'test',
      },
    }
    const validator = new Validator(input)
    expect(validator.validated.id).toEqual(input.id)
    expect(validator.error).not.toBeDefined()
  })

  // START TESTS TO UPDATE
  it('default overrides input is empty', () => {
    const input = {
      id: '1',
      data: {},
    }
    const validator = new Validator(input)
    expect(validator.validated.overrides?.size).toEqual(0)
  })

  it('overrides input is formatted', () => {
    const input = {
      id: '1',
      data: {
        overrides: {
          coingecko: {
            uni: 'uniswap',
          },
        },
      },
    }
    const validator = new Validator(input)
    expect(validator.validated.overrides.get('coingecko').get('uni')).toEqual('uniswap')
  })

  it('errors if overrides is not properly formatted', () => {
    try {
      expect.hasAssertions()
      const input = {
        id: '1',
        data: {
          overrides: {
            uni: 'uniswap',
          },
        },
      }
      new Validator(input, {}, {})
    } catch (error) {
      expect(error?.jobRunID).toEqual('1')
      expect(error?.statusCode).toEqual(400)
      expect(error?.message).toEqual('Parameter supplied with wrong format: "override"')
      expect(error?.cause).toEqual(undefined)
    }
  })

  describe('overrideSymbol', () => {
    it('errors if base was not provided', () => {
      const validator = new Validator()
      expect(() => validator.overrideSymbol('coingecko')).toThrowError()
    })

    it('returns symbol as is if there are no overrides, using input', () => {
      const params: InputParameters = {
        base: {
          required: true,
          type: 'string',
        },
      }
      const input = {
        id: '1',
        data: {
          base: 'btc',
        },
      }
      const validator = new Validator(input, params)
      const base = validator.overrideSymbol('coingecko')
      expect(base).toBe('btc')
    })

    it('returns symbol as is if there are no overrides, using provided symbol argument', () => {
      const validator = new Validator()
      const base = validator.overrideSymbol('coingecko', 'btc')
      expect(base).toBe('btc')
    })

    it('returns non-array symbol value from overrides', () => {
      const input = {
        id: '1',
        data: {
          overrides: {
            coingecko: {
              uni: 'uniswap',
            },
          },
        },
      }
      const validator = new Validator(input)
      const base = validator.overrideSymbol('coingecko', 'uni')
      expect(base).toBe('uniswap')
    })

    it('returns multiple overriden symbols from array input', () => {
      const input = {
        id: '1',
        data: {
          overrides: {
            coingecko: {
              uni: 'uniswap',
            },
          },
        },
      }
      const validator = new Validator(input)
      const base = validator.overrideSymbol('coingecko', ['btc', 'uni'])
      expect(base).toEqual(['btc', 'uniswap'])
    })
  })
  // END TESTS TO UPDATE

  describe('overrideToken', () => {
    it('return ethereum address', () => {
      const validator = new Validator()
      const result = validator.overrideToken('ETH')
      expect(result).toBe('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
    })
  })

  describe('overrideIncludes', () => {
    it('returns undefined when provided with invalid include', () => {
      const validator = new Validator()
      const include = validator.overrideIncludes('ETH', 'BTC')
      expect(include).toBeUndefined()
    })

    it('returns valid include', () => {
      const validator = new Validator()
      const include = validator.overrideIncludes('BTC', 'ETH')
      expect(include).toMatchSnapshot()
    })
  })
})
