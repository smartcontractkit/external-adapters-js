import { createRepoFromStructure, type RepoStructure } from '../repo'

/** Alias for tests: build a Repo from the same structure shape (dependencies + changesets). */
export const createMockRepo = (structure: RepoStructure) => createRepoFromStructure(structure)

export type { RepoStructure }
