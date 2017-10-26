'use strict'

const EE = require('events')
const readline = require('readline')
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const log = require('kittie').child('backport')
const read = require('read')
const Commit = require('./commit')

const bin = require.resolve('branch-diff/branch-diff.js')

module.exports = class Backport extends EE {
  constructor(options) {
    super()

    const opts = Object.assign({
      sourceBranch: 'master'
    , targetBranch: 'v8.8.0-proposal'
    , 'exclude-label': 'semver-major,dont-land-on-v8.x'
    , cwd: process.cwd()
    , 'filter-release': true
    }, options)

    opts['exclude-label'] += ',backport-requested-v8.x'

    const args = [
      opts.targetBranch
    , opts.sourceBranch
    , `--exclude-label=${opts['exclude-label']}`
    , '--reverse'
    ]

    if (opts['filter-release']) args.push('--filter-release')

    this.args = args
    this.child = null
    this.commits = []
    this._current = null

    this._addListeners()
  }

  _addListeners() {
    this.on('failed:cherry-pick', (commit, err) => {
      log.warn('cherry-pick:failed ', commit.sha, 'SKIP')
      setImmediate(() => {
        this._processNextCommit()
      })

      read({
        prompt: `(#${commit.pr}): Ask for backport PR? [y/N]`
      , default: 'n'
      }, (err, result) => {
        if (err) throw err

        const r = result.toLowerCase()
        if (r === 'yes' || r === 'y') {
          log.info('commenting on', commit.prUrl)
          // TODO(evanlucas) actually add comment/backport-requested label to PR
        } else {
          log.warn('cherry-pick:failed ', commit.sha, 'SKIP')
        }

        setImmediate(() => {
          this._processNextCommit()
        })
      })
    })

    this.on('post:cherry-pick', (commit) => {
      log.info('cherry-pick:success', commit.sha)
      setImmediate(() => {
        this._processNextCommit()
      })
    })
  }

  run() {
    const child = spawn(bin, this.args, {
      env: process.env
    , cwd: this.cwd
    })

    child.stderr.pipe(process.stderr)
    child.on('error', (err) => {
      this.emit('error', err)
    })

    const rl = readline.createInterface({
      input: child.stdout
    , output: null
    })

    rl.on('line', (line) => {
      const commit = new Commit(line)
      if (!commit.sha) {
        this.emit('commit:invalid', line)
        return
      }
      this.commits.push(commit)
    })

    rl.on('close', () => {
      this._processCommits()
    })
  }

  _processCommits() {
    log.info('processing...')
    this._processNextCommit()
  }

  _processNextCommit() {
    if (!this.commits.length) {
      log.info('<----------- DONE ----------->')
      return this.emit('done')
    }

    const commit = this.commits.shift()
    this.emit('pre:cherry-pick', commit)
    this._current = commit
    this._processCommit(commit)
  }

  _processCommit(commit) {
    this._tryCherryPick(commit)
  }

  _tryCherryPick(commit) {
    exec(`git cherry-pick ${commit.sha}`, (err, stdout, stderr) => {
      if (err) {
        return this._abortCherryPick(() => {
          this.emit('failed:cherry-pick', commit, err)
        })
      }
      this.emit('post:cherry-pick', commit)
    })
  }

  _abortCherryPick(cb) {
    exec('git cherry-pick --abort', () => {
      cb()
    })
  }
}
