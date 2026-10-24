import { CliError } from './errors.ts'

// todo alt cfg with `git remote get-url origin`
export type MakeNewOpts = {
    repo: string
}

export function parseArgs(args: Array<string>): MakeNewOpts {
    const opts: Partial<MakeNewOpts> = {}
    let shifted: string
    while ((shifted = args.shift()!)) {
        switch (shifted) {
            case '--repo':
                const repo = args.shift()
                if (!!repo) {
                    if (/^[a-z\d]*\/[a-z\d]*$/.test(repo)) {
                        opts.repo = repo
                    } else if (
                        /^https:\/\/github\.com\/[a-z\d]*\/[a-z\d]*$/.test(repo)
                    ) {
                        opts.repo = repo.substring('https://github.com/'.length)
                    }
                }
                if (!opts.repo) {
                    throw new CliError(
                        '--repo must be a `eighty4/changelog` style GitHub repository name',
                    )
                }
                break
            default:
                throw new CliError(shifted + ' is not a supported arg')
        }
    }
    if (!('repo' in opts)) {
        throw new CliError('--repo is required')
    }
    return opts as MakeNewOpts
}

export function makeNewChangelogFromCliArgs(args: Array<string>): string {
    return makeNewChangelog(parseArgs(args))
}

export function makeNewChangelog(opts: MakeNewOpts): string {
    return `# Changelog

## [Unreleased]

### Added

- ???

[Unreleased]: https://github.com/${opts.repo}/commits/main
`
}
