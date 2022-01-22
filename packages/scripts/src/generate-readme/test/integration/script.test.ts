import * as shell from 'shelljs'

describe('readme generation script', () => {
  describe('when generating readme for readme-test-adapter', () => {
    it('should successfully generate readme', async () => {
      const pathToAdapter =
        'packages/scripts/src/generate-readme/test/integration/readme-test-adapter/'
      const generatedReadmePath = pathToAdapter + 'README.md'

      shell.exec(`yarn generate:readme -t ${pathToAdapter}`)

      expect(shell.cat(generatedReadmePath).toString()).toMatchSnapshot()
    })
  })
})
