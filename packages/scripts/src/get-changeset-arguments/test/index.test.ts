import { run } from '../index'
import { createRepoFromStructure } from '../repo'

describe('index', () => {
  describe('run', () => {
    const originalArgv = process.argv
    let exitSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance
    let consoleLogSpy: jest.SpyInstance

    const expectOutput = ({ stdout, stderr }: { stdout: string[]; stderr: string[] }) => {
      stdout.forEach((line, index) => {
        expect(consoleLogSpy).toHaveBeenNthCalledWith(index + 1, line)
      })
      expect(consoleLogSpy).toHaveBeenCalledTimes(stdout.length)

      stderr.forEach((line, index) => {
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(index + 1, line)
      })
      expect(consoleErrorSpy).toHaveBeenCalledTimes(stderr.length)
    }

    beforeEach(() => {
      exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)
      consoleErrorSpy = jest.spyOn(console, 'error').mockReturnValue()
      consoleLogSpy = jest.spyOn(console, 'log').mockReturnValue()
    })

    afterEach(() => {
      process.argv = originalArgv
      exitSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    it('prints usage to stderr and exits 0 when no args', () => {
      process.argv = ['node', 'script']
      const repo = createRepoFromStructure({ dependencies: {}, changesets: {} })

      expect(() => run(repo)).toThrow('process.exit(0)')

      expectOutput({
        stdout: [],
        stderr: [
          'Usage: yarn get-changeset-arguments <possible empty list of adapters to release>',
        ],
      })
      expect(exitSpy).toHaveBeenCalledWith(0)
    })

    it('prints --ignore args to stdout and exits successfully when given valid adapter', () => {
      process.argv = ['node', 'script', 'gold']
      const repo = createRepoFromStructure({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/other-adapter': [],
        },
        changesets: {
          'gold.md': ['@chainlink/gold-adapter'],
        },
      })

      run(repo)

      expectOutput({
        stdout: ['--ignore @chainlink/other-adapter'],
        stderr: [
          'Not ignoring the following transitive dependencies:',
          '@chainlink/gold-adapter',
          '',
          'Expecting the following packages to be released:',
          '@chainlink/gold-adapter',
          '',
        ],
      })
    })

    it('prints error to stderr and exits 1 when adapter name is invalid', () => {
      process.argv = ['node', 'script', 'nonexistent']
      const repo = createRepoFromStructure({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: {},
      })

      expect(() => run(repo)).toThrow('process.exit(1)')

      expectOutput({
        stdout: [],
        stderr: ["'nonexistent' is not an adapter name."],
      })
    })
  })
})
