import { writeFile } from 'node:fs/promises'
import { CliError } from './error.ts'
import { readChangelogFile } from './readChangelog.ts'
import { isSemverVersion } from './semver.ts'

export type RolloverOpts = {
    changelogFile: string
    gitTag: string
    nextVersion: string
}

export function parseArgs(args: Array<string>): RolloverOpts {
    const nextVersion = args.shift()
    if (typeof nextVersion === 'undefined') {
        throw new CliError('missing version')
    }
    if (!isSemverVersion(nextVersion)) {
        throw new CliError(nextVersion + ' is not a `vX.X.X` format semver')
    }
    const opts: RolloverOpts = {
        changelogFile: 'CHANGELOG.md',
        gitTag: nextVersion,
        nextVersion,
    }
    let shifted
    while ((shifted = args.shift())) {
        switch (shifted) {
            case '--changelog-file':
                if (typeof (shifted = args.shift()) === 'undefined') {
                    throw new CliError('--changelog-file value is missing')
                }
                opts.changelogFile = shifted
                break
            case '--git-tag':
                if (typeof (shifted = args.shift()) === 'undefined') {
                    throw new CliError('--git-tag value is missing')
                }
                opts.gitTag = shifted
                break
            default:
                throw new CliError(`bad arg \`${shifted}\``)
        }
    }
    return opts
}

export async function nextVersionRollover(args: Array<string>): Promise<void> {
    const opts = parseArgs(args)
    const changelogContent = await readChangelogFile(opts.changelogFile)
    const unreleasedLinkRegex = /^.*\[Unreleased\]:\s+?(?<url>.*)$/m
    const githubUrlRegex =
        /^https:\/\/github\.com\/(?<owner>\S+?)\/(?<name>\S+?)\/(?<path>.*)$/
    const unreleasedLink =
        changelogContent.match(unreleasedLinkRegex)?.groups?.url
    if (!unreleasedLink) {
        throw new Error()
    }
    const unreleasedLinkGithubUrlMatch = unreleasedLink.match(githubUrlRegex)
    if (!unreleasedLinkGithubUrlMatch?.groups) {
        throw new Error()
    }
    const {
        owner,
        name,
        path: unreleasedGitHubUrlPath,
    } = unreleasedLinkGithubUrlMatch.groups

    let result = changelogContent.replace(
        /## \[Unreleased\]/,
        `## [Unreleased]\n\n- ???\n\n## [${opts.nextVersion}] - ${getCurrentDate()}`,
    )

    if (
        unreleasedGitHubUrlPath.startsWith('compare/') &&
        unreleasedGitHubUrlPath.endsWith('...HEAD')
    ) {
        result = result
            .replace(/\.\.\.HEAD/, `...${opts.gitTag}`)
            .replace(
                /\[Unreleased\]:/,
                `[Unreleased]: https://github.com/${owner}/${name}/compare/${opts.gitTag}...HEAD\n[${opts.nextVersion}]:`,
            )
    } else {
        const next = `[Unreleased]: https://github.com/${owner}/${name}/compare/${opts.gitTag}...HEAD`
        const previous = `[${opts.nextVersion}]: https://github.com/${owner}/${name}/releases/tag/${opts.gitTag}`
        result = result.replace(unreleasedLinkRegex, next + '\n' + previous)
    }
    await writeFile(opts.changelogFile, result)
}

export function getCurrentDate(): string {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const local = new Date(now.getTime() - offset * 60 * 1000)
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`
}
