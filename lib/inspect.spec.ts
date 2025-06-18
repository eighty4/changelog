import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inspectChangelog } from './inspect.ts'

describe.only('inspectChangelog', () => {
    describe('.errors', () => {
        it('none for new', () => {
            const changelog = `# Changelog

## [Unreleased]

### Added

- ???

[Unreleased]: https://github.com/eighty4/cquill/commits/main
`
            assert.deepEqual(inspectChangelog(changelog).errors, [])
        })

        it('none for end of line whitespace', () => {
            const changelog = `# Changelog

## [Unreleased]${'   '}

### Added

- ???

[Unreleased]: https://github.com/eighty4/cquill/commits/main
`
            assert.deepEqual(inspectChangelog(changelog).errors, [])
        })

        it('for bad version header', () => {
            const changelog = `# Changelog

## Bah dop bah dop

- asdf
`
            assert.deepEqual(inspectChangelog(changelog).errors, [
                {
                    excerpt: '## Bah dop bah dop',
                    kind: 'release-header',
                    line: 3,
                },
            ])
        })

        it('for version without link', () => {
            const changelog = `# Changelog

## v0.0.1

- asdf
`
            assert.deepEqual(inspectChangelog(changelog).errors, [
                {
                    excerpt: '## v0.0.1',
                    kind: 'version-brackets',
                    line: 3,
                },
            ])
        })

        it('for version with invalid semver', () => {
            const changelog = `# Changelog

## [v1234.88]

- asdf
`
            assert.deepEqual(inspectChangelog(changelog).errors, [
                {
                    excerpt: '## [v1234.88]',
                    kind: 'version-semver',
                    line: 3,
                },
            ])
        })
    })

    describe('.listMarker', () => {
        it('selects predominant', () => {
            const changelog = `
# Changelog

## [v0.0.1]

- asdf
- sdfg
- dfgh

## [v0.0.0]

* asdf
* sdfg
* dfgh
* ghjk
`
            assert.equal(inspectChangelog(changelog).listMarker, '*')
        })
    })
})
