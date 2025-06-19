#!/usr/bin/env node

import { BadChangelogError, CliError } from './errors.ts'
import type { ChangelogErrorKind } from './inspect.ts'
import { checkUnreleased } from './task.check.ts'
import { getVersionContent } from './task.get.ts'
import { makeNewChangelog } from './task.new.ts'
import { nextVersionRollover } from './task.rollover.ts'

if (process.argv.find(a => a === '--debug-args')) {
    console.log(JSON.stringify(process.argv, null, 4))
    process.exit(0)
}

let args = [...process.argv]
let shiftingEntrypoint: string | undefined
while ((shiftingEntrypoint = args.shift())) {
    if (
        typeof shiftingEntrypoint === 'undefined' ||
        ['changelog', 'bin.ts', 'bin.js'].find(p =>
            shiftingEntrypoint?.endsWith(p),
        )
    ) {
        break
    }
}

let task: 'check' | 'get' | 'new' | 'rollover' | undefined = undefined

if (args.some(arg => arg === '-h' || arg === '--help')) {
    printHelp()
}

let shifted: string | undefined
switch ((shifted = args.shift())) {
    case 'init':
    case 'new':
        task = 'new'
        break
    case 'check':
        task = 'check'
        break
    case 'get':
        task = 'get'
        break
    case 'rollover':
        task = 'rollover'
        break
    default:
        if (typeof shifted === 'undefined') {
            printHelp('missing command')
        } else {
            printHelp(shifted + " isn't a command")
        }
}

try {
    switch (task) {
        case 'check':
            process.exit((await checkUnreleased(args)) ? 0 : 1)
        case 'get':
            console.log(await getVersionContent(args))
            process.exit(0)
        case 'new':
            console.log(makeNewChangelog(args))
            process.exit(0)
        case 'rollover':
            await nextVersionRollover(args)
            process.exit(0)
    }
} catch (e: unknown) {
    errorExit(e)
}

function printHelp(error?: string): never {
    if (error) printError(error)
    const bold = (s: string) => `\u001b[1m${s}\u001b[0m`
    if (!task || task === 'check') {
        console.log(`changelog check [--changelog-file CHANGELOG_FILE]`)
    }
    if (!task || task === 'get') {
        console.log(
            `changelog get ${bold('VERSION')} [--changelog-file CHANGELOG_FILE]`,
        )
    }
    if (!task || task === 'new') {
        console.log(`changelog new ${bold('--repo OWNER/NAME')}`)
    }
    if (!task || task === 'rollover') {
        console.log(
            `changelog rollover ${bold('NEXT_VERSION')} [--git-tag GIT_TAG] [--changelog-file CHANGELOG_FILE]`,
        )
    }
    process.exit(1)
}

function printError(e: unknown) {
    if (e !== null) {
        if (typeof e === 'string') {
            console.error(red('error:'), e)
        } else if (e instanceof Error) {
            console.error(red('error:'), e.message)
            if (e instanceof BadChangelogError) {
                for (const error of e.errors) {
                    const { excerpt, kind, line } = error
                    console.error(
                        `  at line ${line}, ${changelogErrorDescription(kind)}`,
                    )
                    console.error(
                        `    ${changelogErrorCorrection(kind, excerpt)}`,
                    )
                }
            } else if (e instanceof CliError) {
                console.log('changelog -h for more details')
            }
        }
    }
}

function changelogErrorDescription(kind: ChangelogErrorKind): string {
    switch (kind) {
        case 'release-header':
            return 'release header is not valid'
        case 'version-brackets':
            return 'release version must be in Markdown link brackets'
        case 'version-semver':
            return 'release version is not a valid semver'
    }
}

function changelogErrorCorrection(
    kind: ChangelogErrorKind,
    excerpt: string,
): string | undefined {
    switch (kind) {
        case 'version-brackets':
            return `${excerpt} -> ${excerpt
                .split(/\s+/)
                .map((s, i) => (i === 1 ? `${green('[')}${s}${green(']')}` : s))
                .join(' ')}`
        case 'version-semver':
            return `${excerpt
                .split(/\s+/)
                .map((s, i) => (i === 1 ? red(s) : s))
                .join(' ')} -> ${excerpt
                .split(/\s+/)
                .map((s, i) => (i === 1 ? green('[vX.X.X]') : s))
                .join(' ')}`
        default:
            return excerpt
    }
}

function green(s: string): string {
    return `\u001b[32m${s}\u001b[0m`
}

function red(s: string): string {
    return `\u001b[31m${s}\u001b[0m`
}

function errorExit(e?: unknown): never {
    printError(e)
    process.exit(1)
}
