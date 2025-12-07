# GitHub MCP Server — PR Review Tools

Model Context Protocol (MCP) server that exposes GitHub pull request review operations as tools.

## Requirements

- `GITHUB_PERSONAL_ACCESS_TOKEN` **must** be set before starting the server.
- Token scopes:
  - `repo` for private repositories
  - `public_repo` is enough for public repositories

## Available Tools

| Name                                      | What it does                                                      | Key inputs                                 |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| get_pull_request_review                   | Get a specific pull request review                                | owner, repo, pull_number, review_id        |
| get_pull_request_comment                  | Get a specific pull request review comment                        | owner, repo, comment_id                    |
| reply_to_pull_request_comment             | Reply to a specific pull request review comment                   | owner, repo, pull_number, comment_id, body |
| get_pull_request_threads                  | List all review threads for a pull request                        | owner, repo, pull_number                   |
| get_pull_request_thread                   | Fetch one review thread with comments                             | thread_id                                  |
| get_pull_request_threads_batch            | Fetch multiple review threads (with comments) in one GraphQL call | thread_ids[]                               |
| get_pull_request_review_threads           | List threads belonging to a specific review                       | owner, repo, pull_number, review_id        |
| check_pull_request_review_resolution      | Check whether all threads in a review are resolved                | owner, repo, pull_number, review_id        |
| resolve_pull_request_review_thread        | Mark a single review thread as resolved                           | thread_id                                  |
| resolve_pull_request_review_threads_batch | Resolve multiple review threads in one call                       | thread_ids[]                               |

## Install & Run

```bash
npm install
npm run build
npm start
```

To use in Cursor/Claude/other MCP clients, configure a server entry similar to:

```json
{
  "mcpServers": {
    "github-pr-review-tools": {
      "command": "node",
      "args": ["/path/to/repo/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your token here>"
      }
    }
  }
}
```

## Testing

```bash
npm test
```

## License

MIT License.

MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
