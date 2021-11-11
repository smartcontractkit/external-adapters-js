import * as shell from 'shelljs'

describe('readme generation script', () => {
  describe('when generating readme for readme-test-adapter', () => {
    it('should successfully generate readme', async () => {
      const pathToAdapter =
        'packages/scripts/src/generate-readme/test/integration/readme-test-adapter/'
      const generatedReadmePath = pathToAdapter + 'README.md'
      const savedArchivesPath = pathToAdapter + 'readme-archive/'

      shell.exec(`yarn generate:readme ${pathToAdapter}`)

      shell.rm('-rf', savedArchivesPath)

      expect(shell.cat(generatedReadmePath).toString()).toMatchSnapshot()
    })
  })
})
