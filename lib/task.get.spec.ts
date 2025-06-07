import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getVersionContent } from './task.get.ts'

describe('getVersionContent', () => {
    it('throws for bogus semver tag', () => {
        assert.throws(() => getVersionContent('## v25.6.4', 'NotSemver'))
    })

    describe('with change categories', () => {
        it('throws error when empty', () => {
            assert.throws(() =>
                getVersionContent('## v0.0.3\n\n### Added\n\n', 'Unreleased'),
            )
        })

        it('throws error when ??? teaser', () => {
            assert.throws(() =>
                getVersionContent(
                    '## v0.0.2\n\n### Added\n\n- ???\n\n',
                    'Unreleased',
                ),
            )
        })

        it('gets Unreleased notes until prev version', () => {
            const s = `
## [Unreleased]

### Added

- big feature
- a bug

## [v0.0.1]

- mo' bugs
- mo' problems

[Unreleased]: ...
`
            assert.equal(
                getVersionContent(s, 'Unreleased'),
                '### Added\n\n- big feature\n- a bug',
            )
        })

        it('gets Unreleased without a prev version', () => {
            const s = `
## [Unreleased]

### Added

- big feature
- a bug

[Unreleased]: https://github.com/eighty4/c2/commits/main
`
            assert.equal(
                getVersionContent(s, 'Unreleased'),
                '### Added\n\n- big feature\n- a bug',
            )
        })

        it('gets Unreleased notes until EOF', () => {
            const s = `
## [Unreleased]

### Added

- big feature
- a bug
`
            assert.equal(
                getVersionContent(s, 'Unreleased'),
                '### Added\n\n- big feature\n- a bug',
            )
        })

        it('gets version without date', () => {
            const s = `
## [Unreleased]

- ???

## [v0.0.1]

### Added

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(
                getVersionContent(s, 'v0.0.1'),
                '### Added\n\n- big feature\n- a bug',
            )
        })

        it('gets version with date', () => {
            const s = `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21 

### Added

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(
                getVersionContent(s, 'v0.0.1'),
                '### Added\n\n- big feature\n- a bug',
            )
        })

        it('returns empty string when Unreleased teaser present', () => {
            const s = `
## [Unreleased]

### Added

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(getVersionContent(s, 'Unreleased'), '')
        })

        it('filters out empty change categories', () => {
            const s = `
## [Unreleased]

### Added

## [v0.0.1] - 2025-04-21 

### Added

### Removed

- big feature
- a bug


[Unreleased]: ...
`
            assert.equal(
                getVersionContent(s, 'v0.0.1'),
                '### Removed\n\n- big feature\n- a bug',
            )
        })

        it('returns empty string when Unreleased empty', () => {
            const s = `
## [Unreleased]

### Added

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(getVersionContent(s, 'Unreleased'), '')
        })
    })

    describe('without change categories', () => {
        it('throws error when empty', () => {
            assert.throws(() =>
                getVersionContent('## v0.0.3\n\n\n', 'Unreleased'),
            )
        })

        it('throws error when ??? teaser', () => {
            assert.throws(() =>
                getVersionContent('## v0.0.2\n- ???\n\n', 'Unreleased'),
            )
        })

        it('gets Unreleased notes until prev version', () => {
            const s = `
## [Unreleased]

- big feature
- a bug

## [v0.0.1]

- mo' bugs
- mo' problems

[Unreleased]: ...
`
            assert.equal(
                getVersionContent(s, 'Unreleased'),
                '- big feature\n- a bug',
            )
        })

        it('gets Unreleased without a prev version', () => {
            const s = `
## [Unreleased]

- big feature
- a bug

[Unreleased]: https://github.com/eighty4/c2/commits/main
`
            assert.equal(
                getVersionContent(s, 'Unreleased'),
                '- big feature\n- a bug',
            )
        })

        it('gets Unreleased notes until EOF', () => {
            const s = `
## [Unreleased]

- big feature
- a bug
`
            assert.equal(
                getVersionContent(s, 'Unreleased'),
                '- big feature\n- a bug',
            )
        })

        it('gets version without date', () => {
            const s = `
## [Unreleased]

- ???

## [v0.0.1]

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(
                getVersionContent(s, 'v0.0.1'),
                '- big feature\n- a bug',
            )
        })

        it('gets version with date', () => {
            const s = `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(
                getVersionContent(s, 'v0.0.1'),
                '- big feature\n- a bug',
            )
        })

        it('returns empty string when Unreleased teaser present', () => {
            const s = `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(getVersionContent(s, 'Unreleased'), '')
        })

        it('returns empty string when Unreleased empty', () => {
            const s = `
## [Unreleased]

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(getVersionContent(s, 'Unreleased'), '')
        })
    })

    it('throws when version is not present', () => {
        const s = `
## [Unreleased]

- ???

## [v0.0.1] - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
        assert.throws(() => getVersionContent(s, 'v0.0.2'))
    })
})
