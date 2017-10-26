'use strict'

const util = require('util')
const RE = /\* \[\[`([^`]+)`\]\(([^\)]+)\)\] (.*) \[\#([\d]+)\]\(([^\)]+)\)/

module.exports = Commit

function Commit(entry) {
  this._raw = entry
  const matches = entry.match(RE)
  if (matches) {
    this.sha = matches[1]
    this.commitUrl = matches[2]
    this.pr = matches[4]
    this.prUrl = matches[5]
    this.semver = this._parseSemver(entry)
  } else {
    this.sha = null
    this.commitUrl = null
    this.pr = null
    this.prUrl = null
    this.semver = null
  }
}

Commit.prototype._parseSemver = function _parseSemver(entry) {
  if (entry.indexOf('**(SEMVER-MINOR)**') !== -1) return 'minor'
  if (entry.indexOf('**(SEMVER-MAJOR)**') !== -1) return 'major'
  return 'patch'
}

Commit.prototype.inspect = function inspect(depth, options) {
  return {
    sha: this.sha
  , commitUrl: this.commitUrl
  , pr: this.pr
  , prUrl: this.prUrl
  , semver: this.semver
  }
}
