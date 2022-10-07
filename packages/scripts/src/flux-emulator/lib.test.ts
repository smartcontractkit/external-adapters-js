import { Observable } from 'rxjs'
import { checkArgs, Inputs, main, start, stop, writeK6Payload } from './lib'
import { ReferenceContractConfigResponse } from './ReferenceContractConfig'
import fs from 'fs'

const exampleReferenceContractConfigResponse: ReferenceContractConfigResponse = {
  configs: [
    {
      name: 'name',
      contractVersion: 1,
      address: '',
      data: { from: '', to: '' },
      nodes: [],
      deviationThreshold: 1,
      precision: 1,
      symbol: '',
      path: '',
      status: '',
      category: '',
    },
  ],
}

jest.mock('fs')
jest.mock('./ReferenceContractConfig', () => {
  return {
    // fill in any methods we don't wan to mock first
    ...jest.requireActual('./ReferenceContractConfig'),
    // mock any functions that call outside of this machine
    fetchConfigFromUrl: jest
      .fn()
      // check start fetch fail 1
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return ''
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check start fetch fail 2, needs a pass and then fail
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return exampleReferenceContractConfigResponse
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check start fetch fail 2, part 2
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return ''
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check start pass part 1
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return exampleReferenceContractConfigResponse
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check start pass part 2
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return exampleReferenceContractConfigResponse
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check stop fail
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return ''
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check stop pass
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return exampleReferenceContractConfigResponse
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check writeK6Payload fail
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return ''
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // check writeK6Payload pass
      .mockImplementationOnce(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return exampleReferenceContractConfigResponse
          },
        } as Observable<ReferenceContractConfigResponse>
      })
      // all others calls to this pass
      .mockImplementation(() => {
        return {
          toPromise: async (): Promise<unknown> => {
            return exampleReferenceContractConfigResponse
          },
        } as Observable<ReferenceContractConfigResponse>
      }),

    setFluxConfig: jest
      .fn()
      // check start pass part 3 and all other calls
      .mockImplementation(() => {
        return {
          toPromise: async (): Promise<void> => {
            return
          },
        } as Observable<void>
      }),
  }
})

describe('Flux Emulator cli', () => {
  it('should print the usage string if not enough args are provided', async () => {
    try {
      checkArgs()
      expect('').toEqual('We should not make it to this expect statement')
    } catch (err) {
      expect(err).toMatchSnapshot()
    }
  })

  it('should throw an error if the action argument is not a valid option', async () => {
    process.argv = ['', '', '', '', '']
    try {
      checkArgs()
      expect('').toEqual('We should not make it to this expect statement')
    } catch (err) {
      expect(err).toContain('first argument')
      expect(err).toMatchSnapshot()
    }
  })

  it('should throw an error if the adapter name argument is empty', async () => {
    process.argv = ['', '', 'start', '', '']
    try {
      checkArgs()
      expect('').toEqual('We should not make it to this expect statement')
    } catch (err) {
      expect(err).toContain('second argument')
      expect(err).toMatchSnapshot()
    }
  })

  it('should throw an error if the release tag argument is empty', async () => {
    process.argv = ['', '', 'start', 'adapter', '']
    try {
      checkArgs()
      expect('').toEqual('We should not make it to this expect statement')
    } catch (err) {
      expect(err).toContain('third argument')
      expect(err).toMatchSnapshot()
    }
  })

  it('should set weiwatchers and config server values from the environment variables', async () => {
    process.argv = ['', '', 'start', 'adapter', 'unique']
    process.env.WEIWATCHER_SERVER = 'weitest'
    process.env.CONFIG_SERVER = 'configtest'
    const inputs: Inputs = checkArgs()
    expect(inputs.weiWatcherServer).toEqual('weitest')
    expect(inputs.configServerGet).toContain('configtest')
    expect(inputs.configServerSet).toContain('configtest')
    expect(inputs).toMatchSnapshot()
  })

  const exampleInputs: Inputs = {
    action: 'start',
    adapter: 'adapter',
    release: 'release',
    ephemeralName: 'ephemeralName',
    weiWatcherServer: 'weiWatcherServer',
    configServerGet: 'configServerGet',
    configServerSet: 'configServerSet',
  }
  it('should throw an error if it gets a bad master configuration on start', async () => {
    try {
      await start(exampleInputs)
      expect('').toEqual('We should not reach this expect statement')
    } catch (err) {
      expect(err).toContain('master configuration')
      expect(err).toMatchSnapshot()
    }
  })

  it('should throw an error if it gets a bad qa configuration on start', async () => {
    try {
      await start(exampleInputs)
      expect('').toEqual('We should not reach this expect statement')
    } catch (err) {
      expect(err).toContain('qa configuration')
      expect(err).toMatchSnapshot()
    }
  })

  it('should successfully set the flux config when calling start', async () => {
    await start(exampleInputs)
  })

  it('should throw an error if it gets a bad qa config on stop', async () => {
    try {
      await stop(exampleInputs)
      expect('').toEqual('We should not reach this expect statement')
    } catch (err) {
      expect(err).toContain('qa configuration')
      expect(err).toMatchSnapshot()
    }
  })

  it('should succesfully set the new config on stop', async () => {
    await stop(exampleInputs)
  })

  it('should throw an error if it gets a bad master config on writeK6Payload', async () => {
    try {
      await writeK6Payload(exampleInputs)
      expect('').toEqual('We should not reach this expect statement')
    } catch (err) {
      expect(err).toContain('master configuration')
      expect(err).toMatchSnapshot()
    }
  })

  it('should successfully write the k6 payload to disk', async () => {
    await writeK6Payload(exampleInputs)
    expect(fs.writeFileSync).toHaveBeenCalled()
  })

  it('should successfully run main with a start action', async () => {
    process.argv = ['', '', 'start', 'adapter', 'unique']
    process.env.WEIWATCHER_SERVER = ''
    process.env.CONFIG_SERVER = ''
    await main()
  })

  it('should successfully run main with a stop action', async () => {
    process.argv = ['', '', 'stop', 'adapter', 'unique']
    await main()
  })

  it('should successfully run main with a k6payload action', async () => {
    process.argv = ['', '', 'k6payload', 'adapter', 'unique']
    await main()
  })
})
