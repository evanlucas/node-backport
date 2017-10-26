# node-backport

Backport commits to node.js release lines

## Install

```bash
$ npm install [-g] evanlucas/node-backport
```

## Test

```bash
$ npm test
```

## Example

In nodejs/node:

```bash
$ git checkout -b v8.8.2-proposal
$ node-backport -s master -t v8.8.2-proposal
```

## Author

Evan Lucas

## License

MIT (See `LICENSE` for more info)
