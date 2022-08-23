import {
  ChangedAdapters,
  checkArgs,
  createOutput,
  generateFilteredAdaptersListByType,
  loadChangedFileList,
  main,
} from './lib'

const changedFilesExample = [
  'packages/sources/xbto/package.json',
  'packages/sources/coinpaprika/src/index.ts',
  'packages/sources/coingecko/test/integration/__snapshots__/adapter.test.ts.snap',
]

jest.mock('fs', () => {
  return {
    // fill in any methods we don't wan to mock first
    ...jest.requireActual('fs'),
    // mock any functions that call outside of this machine
    readFileSync: jest
      .fn()
      .mockImplementationOnce((): Buffer => {
        return Buffer.from(changedFilesExample.join('\n'), 'utf-8')
      })
      .mockImplementationOnce((): Buffer => {
        return Buffer.from(changedFilesExample.join('\n'), 'utf-8')
      }),
  }
})

describe('get-changed-adapters cli', () => {
  describe('check args', () => {
    it('should print the usage string if not enough args are provided', async () => {
      process.argv = ['', '']
      try {
        checkArgs()
        expect('').toEqual('We should not make it to this expect statement')
      } catch (err) {
        expect(err).toMatchSnapshot()
      }
    })

    it('should throw an error if the action argument is not a valid option', async () => {
      process.argv = ['', '', '']
      try {
        checkArgs()
        expect('').toEqual('We should not make it to this expect statement')
      } catch (err) {
        expect(err).toContain('1 argument')
        expect(err).toMatchSnapshot()
      }
    })

    it('should return the file if the correct number of valid arguments are passed', async () => {
      const fileName = 'testFile.js'
      process.argv = ['', '', fileName]
      expect(checkArgs()).toEqual(fileName)
    })
  })

  describe('generateFilteredAdaptersListByType', () => {
    it('should return the different types of adapters when multiple exist are changed and return that core was changed when core changes occur', () => {
      const changedFiles = [
        'packages/sources/abc/src/package.json',
        'packages/sources/abc/test/package.json',
        'packages/composites/bcd/src/index.ts',
        'packages/targets/gef/src/blarg/blarg/blarg.ts',
        'packages/core/any/src/anything.ts',
      ]
      const changedAdapters = generateFilteredAdaptersListByType(changedFiles)
      expect(changedAdapters.sources.length).toEqual(1)
      expect(changedAdapters.composites.length).toEqual(1)
      expect(changedAdapters.targets.length).toEqual(1)
      expect(changedAdapters.coreWasChanged).toBeTruthy()
      expect(changedAdapters).toMatchSnapshot()
    })

    it('should exclude non package and test files', () => {
      const changedFiles = [
        'packages/sources/abc/test/blarg.json',
        'packages/composites/bcd/src/index.ts',
        'package.json',
      ]
      const changedAdapters = generateFilteredAdaptersListByType(changedFiles)
      expect(changedAdapters.sources.length).toEqual(0)
      expect(changedAdapters.composites.length).toEqual(1)
      expect(changedAdapters.targets.length).toEqual(0)
      expect(changedAdapters.coreWasChanged).toBeFalsy()
      expect(changedAdapters).toMatchSnapshot()
    })
  })

  describe('createOutput', () => {
    it('should return the list of adapters when adapters exist in each type', async () => {
      const changedAdapters: ChangedAdapters = {
        sources: ['coingecko'],
        composites: ['coinpaprika'],
        targets: ['ghi'],
        'non-deployable': ['reduce'],
        coreWasChanged: true,
      }
      const output = createOutput(changedAdapters)
      expect(output).toContain('coingecko')
      expect(output).toContain('coinpaprika')
      expect(output).toMatchSnapshot()
    })
  })

  describe('loadChangedFileList', () => {
    it('should return an array of changed files', async () => {
      const changedFiles = loadChangedFileList('test file name')
      expect(changedFiles.length).toEqual(3)
      expect(changedFiles).toMatchSnapshot()
    })
  })

  describe('main', () => {
    it('should successfully run when a valid file is input', async () => {
      // capture the console output
      console.log = jest.fn()

      const fileName = 'testFile.js'
      process.argv = ['', '', fileName]
      main()

      // verify the console output
      expect(console.log).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalledWith('coinpaprika')
    })
  })
})
