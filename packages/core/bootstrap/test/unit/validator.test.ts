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
      const input = { id: 'abc123' }

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
        id: 'abc123',
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
      const validator = new Validator({}, params, {}, { shouldThrowError: false })
      expect(validator.validated.id).toEqual('1')
      expect(validator.validated.data).toEqual({})
      expect(validator.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('errors if empty string is provided', () => {
      const input = {
        id: '1',
        data: {
          endpoint: '',
        },
      }
      const validator = new Validator(input, params, {}, { shouldThrowError: false })
      expect(validator.validated.id).toEqual('1')
      expect(validator.validated.data).toEqual({})
      expect(validator.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('errors if an array param is not provided', () => {
      const input = {
        id: 'abc123',
        data: {
          endpoint: 'test',
        },
      }

      const validator = new Validator(input, params, {}, { shouldThrowError: false })
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.validated.data).toEqual({
        endpoint: 'test',
        includes: undefined,
        overrides: undefined,
        resultPath: undefined,
        tokenOverrides: undefined,
      })
      expect(validator?.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('errors if a boolean param is not provided', () => {
      const input = {
        id: 'abc123',
        data: {
          one: 'test',
        },
      }

      const validator = new Validator(input, params, {}, { shouldThrowError: false })
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('does not error if required params are included', () => {
      const input = {
        id: 'abc123',
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
      const input = {
        id: '1',
        data: {
          key1: 'A',
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual(
        'Required parameter key2 must be non-null and non-empty',
      )
    })

    it('errors if dependent params are missing', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          page: 3,
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual('page dependency limit not supplied')
    })

    it('errors if exclusive params are present', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          page: 3,
          indexes: [0, 1],
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual('page dependency limit not supplied')
    })

    it('errors if param does not have required string type', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 1,
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual('key2 parameter must be of type string')
    })

    it('errors if param does not have required boolean type', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          verbose: 'yes',
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual('verbose parameter must be of type boolean')
    })

    it('errors if param does not have required array type', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          indexes: '1, 2, 3',
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual(
        'indexes parameter must be a non-empty array',
      )
    })

    it('errors if param does not have required object type', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          valueObject: [1, 2, 3],
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual(
        'valueObject parameter must be an object with at least one property',
      )
    })

    it('errors if param does not have required number type', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          limit: 'limit',
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual('limit parameter must be of type number')
    })

    it('errors if param does not have required bigint type', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          bigInt: 3,
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual('bigInt parameter must be of type bigint')
    })

    it('errors if param does not use element of options', () => {
      const input = {
        id: '1',
        data: {
          key1: 'A',
          key2: 'B',
          bigInt: BigInt(123),
        },
      }

      const validator = new Validator(input, inputConfig, {}, { shouldThrowError: false })
      expect(validator.errored?.error?.message).toEqual(
        'bigInt parameter is not in the set of available options',
      )
    })
  })

  it('accepts input without customParams', () => {
    const input = {
      id: 'abc123',
      data: {
        endpoint: 'test',
        one: 'test',
      },
    }
    const validator = new Validator(input)
    expect(validator.validated.id).toEqual(input.id)
    expect(validator.error).not.toBeDefined()
  })

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
    const input = {
      id: '1',
      data: {
        overrides: {
          uni: 'uniswap',
        },
      },
    }
    const validator = new Validator(input, {}, {}, { shouldThrowError: false })
    expect(validator.error).toBeTruthy()
    expect(validator?.error?.statusCode).toEqual(400)
    expect(validator?.error?.status).toEqual('errored')
  })
})
