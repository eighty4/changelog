import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { CliError } from './errors.ts'
import { checkUnreleased, parseArgs } from './task.check.ts'

async function makeTempDir(): Promise<string> {
    return await mkdtemp(join(tmpdir(), 'changelog-test-'))
}

async function removeDir(p: string): Promise<void> {
    await rm(p, { force: true, recursive: true })
}

describe('changelog check', () => {
    describe('parseArgs', () => {
        it('err with --changelog-file missing value', () => {
            assert.throws(
                () => parseArgs(['--changelog-file']),
                e =>
                    e instanceof CliError &&
                    e.message === '--changelog-file value is missing',
            )
        })
        it('err with unknown arg', () => {
            assert.throws(
                () => parseArgs(['--coffee']),
                e =>
                    e instanceof CliError && e.message === 'bad arg `--coffee`',
            )
        })
        it('parses empty args', () => {
            assert.deepEqual(parseArgs([]), {
                changelogFile: 'CHANGELOG.md',
            })
        })
        it('parses args with changelog file', () => {
            assert.deepEqual(
                parseArgs(['--changelog-file', 'cli/CHANGELOG.md']),
                {
                    changelogFile: 'cli/CHANGELOG.md',
                },
            )
        })
    })

    describe('checkUnreleased', () => {
        let tmpDir: string

        beforeEach(async () => {
            tmpDir = await makeTempDir()
        })

        afterEach(async () => removeDir(tmpDir))

        async function makeFile(
            filename: string,
            content: string,
        ): Promise<string> {
            const p = join(tmpDir, filename)
            await writeFile(p, content)
            return p
        }

        describe('list marker support', () => {
            for (const listMarker of ['*', '-', '+']) {
                for (const unreleasedContent of ['???', 'content']) {
                    it(`matches ${listMarker} ${unreleasedContent}`, async () => {
                        const p = await makeFile(
                            'CHANGELOG.md',
                            `## [Unreleased]
${listMarker} ${unreleasedContent}
## [v0.0.2]
${listMarker} real work`,
                        )
                        assert.equal(
                            await checkUnreleased(['--changelog-file', p]),
                            unreleasedContent !== '???',
                            `${listMarker} ${unreleasedContent}`,
                        )
                    })
                }
            }
        })

        describe('with change categories', () => {
            it('returns true', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- Area 51 photos

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    true,
                )
            })

            it('returns false', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

### Changed

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    false,
                )
            })

            it('returns false with only ??? teaser', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- ???

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    false,
                )
            })
        })

        describe('without change categories', () => {
            it('returns true', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- Area 51 photos

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    true,
                )
            })

            it('returns false', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    false,
                )
            })

            it('returns false with only ??? teaser', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]
- ???
[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    false,
                )
            })
        })

        describe('with prior version', () => {
            it('returns true', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- Area 51 photos

## [0.0.2]

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    true,
                )
            })

            it('returns false', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

## [0.0.2]

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    false,
                )
            })

            it('returns false with only ??? teaser', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- ???

## [0.0.2]

[Unreleased]: ...
`,
                )
                assert.equal(
                    await checkUnreleased(['--changelog-file', p]),
                    false,
                )
            })
        })
    })
})
