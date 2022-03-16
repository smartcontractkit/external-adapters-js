import * as shell from 'shelljs'

describe('readme generation script', () => {
  describe('when generating readme for readme-test-adapter', () => {
    it('should successfully generate readme', async () => {
      const pathToAdapter =
        'packages/scripts/src/generate-readme/test/integration/readme-test-adapter/'
      const generatedReadmePath = pathToAdapter + 'README.md'

      shell.exec(`yarn generate:readme -t ${pathToAdapter}`)

      let readmeString = shell.cat(generatedReadmePath).toString()

      // Replace version # to prevent test from failing on every upgrade
      const semverRegex = new RegExp(/Version: [0-9]+(\.[0-9]+)*/)
      readmeString = readmeString.replace(semverRegex, 'Version: X.X.X')

      expect(readmeString).toMatchSnapshot()
    })
  })
})
