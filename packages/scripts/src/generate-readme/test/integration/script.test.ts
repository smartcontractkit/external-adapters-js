import child_process from 'child_process'
import fs from 'fs'

describe('readme generation script', () => {
  describe('when generating readme for readme-test-adapter', () => {
    it('should successfully generate readme', async () => {
      const pathToScript = 'packages/scripts/src/generate-readme/'
      const pathToAdapter = pathToScript + 'readme-test-adapter/'
      const generatedReadmePath = pathToAdapter + 'README.md'

      await child_process.exec(`yarn generate:readme ${pathToAdapter}`)

      expect(fs.readFileSync(generatedReadmePath).toString()).toMatchSnapshot()
    })
  })
})
