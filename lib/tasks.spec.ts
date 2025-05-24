import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
    checkUnreleased,
    getRolloverResult,
    getVersionContent,
} from './tasks.ts'

describe('getRolloverResult', () => {
    describe('with change categories', () => {
        it('adds first tag', () => {
            const tag = 'v0.0.1'
            const s = `
## Unreleased

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`

            assert.equal(
                getRolloverResult(s, tag),
                `
## Unreleased

- ???

## v0.0.1 - ${new Date().toISOString().substring(0, 10)}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
            )
        })

        it('adds another tag', () => {
            const tag = 'v0.0.2'
            const s = `
## Unreleased

### Added

- did more stuff

## v0.0.1 - ${new Date().toISOString().substring(0, 10)}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`

            assert.equal(
                getRolloverResult(s, tag),
                `
## Unreleased

- ???

## v0.0.2 - ${new Date().toISOString().substring(0, 10)}

### Added

- did more stuff

## v0.0.1 - ${new Date().toISOString().substring(0, 10)}

### Added

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.2...HEAD
[v0.0.2]: https://github.com/eighty4/c2/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
            )
        })
    })

    describe('without change categories', () => {
        it('adds first tag', () => {
            const tag = 'v0.0.1'
            const s = `
## Unreleased

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/commits/main
`

            assert.equal(
                getRolloverResult(s, tag),
                `
## Unreleased

- ???

## v0.0.1 - ${new Date().toISOString().substring(0, 10)}

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
            )
        })

        it('adds another tag', () => {
            const tag = 'v0.0.2'
            const s = `
## Unreleased

- did more stuff

## v0.0.1 - ${new Date().toISOString().substring(0, 10)}

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.1...HEAD
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`

            assert.equal(
                getRolloverResult(s, tag),
                `
## Unreleased

- ???

## v0.0.2 - ${new Date().toISOString().substring(0, 10)}

- did more stuff

## v0.0.1 - ${new Date().toISOString().substring(0, 10)}

- did some stuff

[Unreleased]: https://github.com/eighty4/c2/compare/v0.0.2...HEAD
[v0.0.2]: https://github.com/eighty4/c2/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/eighty4/c2/releases/tag/v0.0.1
`,
            )
        })
    })

    it('throws for bogus semver tag', () => {
        assert.throws(() => getRolloverResult('', 'a.b.c'))
    })
})
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
## Unreleased

### Added

- big feature
- a bug

## v0.0.1

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
## Unreleased

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
## Unreleased

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
## Unreleased

- ???

## v0.0.1 

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
## Unreleased

- ???

## v0.0.1 - 2025-04-21 

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
## Unreleased

### Added

- ???

## v0.0.1 - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(getVersionContent(s, 'Unreleased'), '')
        })

        it('filters out empty change categories', () => {
            const s = `
## Unreleased

### Added

## v0.0.1 - 2025-04-21 

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
## Unreleased

### Added

## v0.0.1 - 2025-04-21 

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
## Unreleased

- big feature
- a bug

## v0.0.1

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
## Unreleased

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
## Unreleased

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
## Unreleased

- ???

## v0.0.1 

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
## Unreleased

- ???

## v0.0.1 - 2025-04-21 

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
## Unreleased

- ???

## v0.0.1 - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(getVersionContent(s, 'Unreleased'), '')
        })

        it('returns empty string when Unreleased empty', () => {
            const s = `
## Unreleased

## v0.0.1 - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
            assert.equal(getVersionContent(s, 'Unreleased'), '')
        })
    })

    it('throws when version is not present', () => {
        const s = `
## Unreleased

- ???

## v0.0.1 - 2025-04-21 

- big feature
- a bug

[Unreleased]: ...
`
        assert.throws(() => getVersionContent(s, 'v0.0.2'))
    })
})

describe('checkUnreleased', () => {
    describe('with change categories', () => {
        it('returns true', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

### Added

- Area 51 photos

[Unreleased]: ...
`),
                true,
            )
        })

        it('returns false', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

### Added

### Changed

[Unreleased]: ...
`),
                false,
            )
        })

        it('returns false with only ??? teaser', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

### Added

- ???

[Unreleased]: ...
`),
                false,
            )
        })
    })

    describe('without change categories', () => {
        it('returns true', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

- Area 51 photos

[Unreleased]: ...
`),
                true,
            )
        })

        it('returns false', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

[Unreleased]: ...
`),
                false,
            )
        })

        it('returns false with only ??? teaser', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased
- ???
[Unreleased]: ...
`),
                false,
            )
        })
    })

    describe('with prior version', () => {
        it('returns true', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

- Area 51 photos

## 0.0.2

[Unreleased]: ...
`),
                true,
            )
        })

        it('returns false', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

## 0.0.2

[Unreleased]: ...
`),
                false,
            )
        })

        it('returns false with only ??? teaser', () => {
            assert.equal(
                checkUnreleased(`
## Unreleased

- ???

## 0.0.2

[Unreleased]: ...
`),
                false,
            )
        })
    })
})
