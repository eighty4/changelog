import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { CliError } from './errors.ts'
import { getVersionContent, parseArgs } from './task.get.ts'

async function makeTempDir(): Promise<string> {
    return await mkdtemp(join(tmpdir(), 'changelog-test-'))
}

async function removeDir(p: string): Promise<void> {
    await rm(p, { force: true, recursive: true })
}

describe('changelog get', () => {
    describe('parseArgs', () => {
        it('err without version', () => {
            assert.throws(
                () => parseArgs([]),
                e => e instanceof CliError && e.message === 'missing version',
            )
        })
        it('err with invalid semver version', () => {
            assert.throws(
                () => parseArgs(['Skynet3.0']),
                e =>
                    e instanceof CliError &&
                    e.message === 'Skynet3.0 is not a `vX.X.X` format semver',
            )
        })
        it('rejects prerelease semver', () => {
            assert.throws(
                () => parseArgs(['v0.0.2-0']),
                e =>
                    e instanceof CliError &&
                    e.message === 'v0.0.2-0 is not a `vX.X.X` format semver',
            )
        })
        it('err with --changelog-file missing value', () => {
            assert.throws(
                () => parseArgs(['v0.0.1', '--changelog-file']),
                e =>
                    e instanceof CliError &&
                    e.message === '--changelog-file value is missing',
            )
        })
        it('err with unknown arg', () => {
            assert.throws(
                () => parseArgs(['v0.0.1', '--phaedrus']),
                e =>
                    e instanceof CliError &&
                    e.message === 'bad arg `--phaedrus`',
            )
        })
        it('parses args with only version', () => {
            assert.deepEqual(parseArgs(['v0.0.1']), {
                changelogFile: 'CHANGELOG.md',
                version: 'v0.0.1',
            })
        })
        it('parses args with Unreleased as version', () => {
            assert.deepEqual(parseArgs(['Unreleased']), {
                changelogFile: 'CHANGELOG.md',
                version: 'Unreleased',
            })
        })
        it('parses args with changelog file', () => {
            assert.deepEqual(
                parseArgs(['v0.0.1', '--changelog-file', 'cli/CHANGELOG.md']),
                {
                    changelogFile: 'cli/CHANGELOG.md',
                    version: 'v0.0.1',
                },
            )
        })
    })

    describe('getVersionContent', () => {
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
                it(`matches ${listMarker}`, async () => {
                    const p = await makeFile(
                        'CHANGELOG.md',
                        `## [v0.0.2]\n\n${listMarker} real work`,
                    )
                    assert.equal(
                        await getVersionContent([
                            'v0.0.2',
                            '--changelog-file',
                            p,
                        ]),
                        `${listMarker} real work`,
                    )
                })
            }
        })

        describe('with change categories', () => {
            it('throws error when empty', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    '## [v0.0.3]\n\n### Added\n\n',
                )
                await assert.rejects(
                    () =>
                        getVersionContent([
                            'Unreleased',
                            '--changelog-file',
                            p,
                        ]),
                    e => e.message === 'Unreleased not found',
                )
            })

            it('gets Unreleased notes until prev version', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- big feature
- a bug

## [v0.0.1]

- mo' bugs
- mo' problems

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '### Added\n\n- big feature\n- a bug',
                )
            })

            it('gets Unreleased without a prev version', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- big feature
- a bug

[Unreleased]: https://github.com/eighty4/c2/commits/main
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '### Added\n\n- big feature\n- a bug',
                )
            })

            it('gets Unreleased notes until EOF', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- big feature
- a bug
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '### Added\n\n- big feature\n- a bug',
                )
            })

            it('gets version without date', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- ???

## [v0.0.1]

### Added

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent(['v0.0.1', '--changelog-file', p]),
                    '### Added\n\n- big feature\n- a bug',
                )
            })

            it('gets version with date', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21

### Added

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent(['v0.0.1', '--changelog-file', p]),
                    '### Added\n\n- big feature\n- a bug',
                )
            })

            it('returns empty string when Unreleased teaser present', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '',
                )
            })

            it('filters out empty change categories', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

## [v0.0.1] - 2025-04-21 

### Added

### Removed

- big feature
- a bug


[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent(['v0.0.1', '--changelog-file', p]),
                    '### Removed\n\n- big feature\n- a bug',
                )
            })

            it('returns empty string when Unreleased empty', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

### Added

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '',
                )
            })
        })

        describe('without change categories', () => {
            it('throws error when empty', async () => {
                const p = await makeFile('CHANGELOG.md', '## [v0.0.3]\n\n\n')
                await assert.rejects(
                    () =>
                        getVersionContent([
                            'Unreleased',
                            '--changelog-file',
                            p,
                        ]),
                    e => e.message === 'Unreleased not found',
                )
            })

            it('throws error when ??? teaser', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    '## [v0.0.2]\n- ???\n\n',
                )
                await assert.rejects(
                    () =>
                        getVersionContent([
                            'Unreleased',
                            '--changelog-file',
                            p,
                        ]),
                    e => e.message === 'Unreleased not found',
                )
            })

            it('gets Unreleased notes until prev version', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- big feature
- a bug

## [v0.0.1]

- mo' bugs
- mo' problems

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '- big feature\n- a bug',
                )
            })

            it('gets Unreleased without a prev version', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- big feature
- a bug

[Unreleased]: https://github.com/eighty4/c2/commits/main
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '- big feature\n- a bug',
                )
            })

            it('gets Unreleased notes until EOF', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- big feature
- a bug
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '- big feature\n- a bug',
                )
            })

            it('gets version without date', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- ???

## [v0.0.1]

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent(['v0.0.1', '--changelog-file', p]),
                    '- big feature\n- a bug',
                )
            })

            it('gets version with date', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent(['v0.0.1', '--changelog-file', p]),
                    '- big feature\n- a bug',
                )
            })

            it('returns empty string when Unreleased teaser present', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '',
                )
            })

            it('returns empty string when Unreleased empty', async () => {
                const p = await makeFile(
                    'CHANGELOG.md',
                    `
## [Unreleased]

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`,
                )
                assert.equal(
                    await getVersionContent([
                        'Unreleased',
                        '--changelog-file',
                        p,
                    ]),
                    '',
                )
            })
        })

        it('throws when version is not present', async () => {
            const p = await makeFile(
                'CHANGELOG.md',
                `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`,
            )
            await assert.rejects(
                () => getVersionContent(['v0.0.2', '--changelog-file', p]),
                e => e.message === 'v0.0.2 not found',
            )
        })
    })
})
