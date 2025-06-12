import { CliError } from './error.ts'
import { readChangelogFile } from './readChangelog.ts'

export type CheckUnreleasedOpts = {
    changelogFile: string
}

export function parseArgs(args: Array<string>): CheckUnreleasedOpts {
    const opts: CheckUnreleasedOpts = {
        changelogFile: 'CHANGELOG.md',
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
            default:
                throw new CliError(`bad arg \`${shifted}\``)
        }
    }
    return opts
}

export async function checkUnreleased(args: Array<string>): Promise<boolean> {
    const opts = parseArgs(args)
    const changelogContent = await readChangelogFile(opts.changelogFile)
    const notes = /## \[Unreleased\](?<notes>[\s\S]+?)(?=\s+(## |\[))/
        .exec(changelogContent)
        ?.groups?.notes?.trim()
    if (!notes?.length) {
        return false
    }
    return (
        notes.split(/\r?\n/).filter(l => {
            if (l.startsWith('### ')) {
                return false
            }
            l = l.trim()
            return l.length && l !== '- ???'
        }).length > 0
    )
}
