import {
  checkCommandIsInstalled,
  checkArgs,
  generateName,
  Inputs,
  verifyWeAreOnSdlcCluster,
  IMAGE_TAG,
  IMAGE_REPOSITORY,
  HELM_CHART_DIR,
  deployAdapter,
  removeAdapter,
  main,
} from './lib'
import { ShellOut } from '../shell/Shell'

// mock all the shell usages for the testing
jest.mock('../shell/Shell', () => {
  return {
    Shell: jest
      .fn()
      .mockImplementationOnce(() => {
        // check command fail 1
        return {
          exec: () => {
            return '' as ShellOut
          },
        }
      })
      .mockImplementationOnce(() => {
        // verify on sdlc cluster fail 1
        return {
          exec: () => {
            return { code: 1 } as ShellOut
          },
        }
      })
      .mockImplementationOnce(() => {
        // deploy adapter fail 1
        return {
          exec: () => {
            return { code: 1 } as ShellOut
          },
        }
      })
      .mockImplementationOnce(() => {
        // deploy adapter fail 2 pt 1
        return {
          exec: () => {
            return { code: 0 } as ShellOut
          },
        }
      })
      .mockImplementationOnce(() => {
        // deploy adapter fail 2 pt 2
        return {
          exec: () => {
            return { code: 1 } as ShellOut
          },
        }
      })
      .mockImplementationOnce(() => {
        // remove adapter fail 1
        return {
          exec: () => {
            return { code: 1 } as ShellOut
          },
        }
      })
      .mockImplementation(() => {
        return {
          exec: () => {
            return { code: 0 } as ShellOut
          },
        }
      }),
  }
})

describe('Ephemeral Adapters Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('starting and stopping ephemeral adapters', () => {
    it('should generate an expected qa adapter name', async () => {
      const inputs: Inputs = {
        action: 'start',
        adapter: 'name',
        release: 'release',
        name: '',
      }
      expect(generateName(inputs)).toEqual('qa-ea-name-release')
    })
    it('should throw an error if a command is not installed', async () => {
      let failed = false
      try {
        checkCommandIsInstalled('test')
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it('should throw an error if we are not on the sdlc cluster', async () => {
      let failed = false
      try {
        verifyWeAreOnSdlcCluster()
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it("should throw an error if we can't download the helm chart", async () => {
      let failed = false
      try {
        deployAdapter({
          action: '',
          adapter: '',
          release: '',
          imageTag: '',
          imageRepository: '',
          helmChartDir: '',
          helmValuesOverride: '',
          name: '',
        })
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it("should throw an error if we can't deploy the helm chart", async () => {
      let failed = false
      try {
        deployAdapter({
          action: 'start',
          adapter: '',
          release: '',
          imageTag: '',
          imageRepository: '',
          helmChartDir: '',
          helmValuesOverride: '',
          name: '',
        })
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it("should throw an error if we can't remove the adapter", async () => {
      let failed = false
      try {
        removeAdapter({
          action: 'stop',
          adapter: '',
          release: '',
          imageTag: '',
          imageRepository: '',
          helmChartDir: '',
          helmValuesOverride: '',
          name: '',
        })
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it('should throw if args are less than 5', async () => {
      process.argv = []
      let failed = false
      try {
        checkArgs()
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it('should throw if we do not have a valid action as the first argument', async () => {
      process.argv = ['', '', '', '', '', '']
      let failed = false
      try {
        checkArgs()
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it('should throw if we an empty string for the second argument', async () => {
      process.argv = ['', '', 'start', '', '', '']
      let failed = false
      try {
        checkArgs()
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it('should throw if we an empty string for the third argument', async () => {
      process.argv = ['', '', 'start', 'adapter', '', '']
      let failed = false
      try {
        checkArgs()
        failed = true
      } catch (error) {
        expect(error).toMatchSnapshot()
      }
      expect(failed).toEqual(false)
    })

    it('should use defaults if minimum viable arguments are passed', async () => {
      process.argv = ['', '', 'start', 'adapter', 'release', '']
      const inputs = checkArgs()
      expect(inputs.imageTag).toEqual(IMAGE_TAG)
      expect(inputs.imageRepository).toEqual(IMAGE_REPOSITORY)
      expect(inputs.helmChartDir).toEqual(HELM_CHART_DIR)
      expect(inputs.helmValuesOverride).toEqual('')
      expect(inputs).toMatchSnapshot()
    })

    it('should override any values passed in as arguments or environment variables', async () => {
      process.argv = ['', '', 'start', 'adapter', 'release', 'test_tag']
      process.env['IMAGE_REPOSITORY'] = 'test_image_repo'
      process.env['HELM_CHART_DIR'] = 'helm_chart_dir'
      process.env['HELM_VALUES'] = 'helm_values'
      const inputs = checkArgs()
      expect(inputs.imageTag).toEqual('test_tag')
      expect(inputs.imageRepository).toEqual('test_image_repo')
      expect(inputs.helmChartDir).toEqual('helm_chart_dir')
      expect(inputs.helmValuesOverride).toEqual('-f helm_values')
      expect(inputs).toMatchSnapshot()
    })

    it('should successfully run the main function when starting an adapter', async () => {
      process.argv = ['', '', 'start', 'adapter', 'release', '']
      await main()
    })

    it('should successfully run the main function when stopping an adapter', async () => {
      process.argv = ['', '', 'stop', 'adapter', 'release', '']
      await main()
    })
  })
})
