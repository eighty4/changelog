#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { CliError } from './error.ts'
import {
    checkUnreleased,
    getRolloverResult,
    getVersionContent,
} from './tasks.ts'
import { makeNewChangelog } from './task.new.ts'

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

if (args.some(arg => arg === '-h' || arg === '--help')) {
    printHelp()
}

type Task =
    | { type: 'check' }
    | { type: 'get'; version: string }
    | { type: 'rollover'; version: string }

let task: Task
let changelogPath: string = 'CHANGELOG.md'

function expectVersionNext(): string | never {
    const version = args.shift()
    if (!version || version.startsWith('--')) {
        printHelp('missing version')
    }
    return version
}

switch (args.shift()) {
    case 'check':
        task = { type: 'check' }
        break
    case 'get':
        task = { type: 'get', version: expectVersionNext() }
        break
    case 'init':
    case 'new':
        try {
            console.log(makeNewChangelog(args))
            process.exit(0)
        } catch (e: unknown) {
            errorExit(e)
        }
    case 'rollover':
        task = { type: 'rollover', version: expectVersionNext() }
        break
    default:
        printHelp('missing command')
}

function printHelp(error?: string): never {
    if (error) printError(error)
    const bold = (s: string) => `\u001b[1m${s}\u001b[0m`
    console.log(`changelog check [--changelog-file CHANGELOG_FILE]`)
    console.log(
        `changelog get ${bold('VERSION')} [--changelog-file CHANGELOG_FILE]`,
    )
    console.log(`changelog new ${bold('--repo OWNER/NAME')}`)
    console.log(
        `changelog rollover ${bold('NEXT_VERSION')} [--changelog-file CHANGELOG_FILE]`,
    )
    process.exit(1)
}

while (args.length) {
    switch (args.shift()) {
        case '--changelog-file':
            const shiftedChangelogFile = args.shift()
            if (
                !shiftedChangelogFile ||
                shiftedChangelogFile.startsWith('--')
            ) {
                errorExit(`--changelog-file param is missing`)
            } else {
                changelogPath = shiftedChangelogFile
            }
            break
        default:
            throw new Error()
    }
}

let changelogContent: string
try {
    changelogContent = await readFile(changelogPath, 'utf-8')
} catch (e: unknown) {
    if (
        e !== null &&
        e instanceof Error &&
        'code' in e &&
        e.code === 'ENOENT'
    ) {
        errorExit(changelogPath + ' does not exist')
    } else {
        errorExit(e)
    }
}

if (task.type === 'check') {
    process.exit(checkUnreleased(changelogContent) ? 0 : 1)
} else if (task.type === 'get') {
    try {
        console.log(getVersionContent(changelogContent, task.version))
    } catch (e) {
        errorExit(e)
    }
} else if (task.type === 'rollover') {
    try {
        const result = getRolloverResult(changelogContent, task.version)
        await writeFile(changelogPath, result)
    } catch (e: unknown) {
        errorExit(e)
    }
}

function printError(e: unknown) {
    if (e !== null) {
        const red = (s: string) => `\u001b[31m${s}\u001b[0m`
        if (typeof e === 'string') {
            console.error(red('error:'), e)
        } else if (e instanceof Error) {
            console.error(red('error:'), e.message)
            if (e instanceof CliError) {
                console.log('changelog -h for more details')
            }
        }
    }
}

function errorExit(e?: unknown): never {
    printError(e)
    process.exit(1)
}
