Yarn to build
Yarn start to run. 

Install into cursor:

{
  "mcpServers": {
    "github-pr-review-tools": {
      "command": "node",
      "args": ["~/Code/github-server-only/dist/index.js"], #put your repo location
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": <your code here>
      }
    }
  }
}


## Build

Docker build: (haven't tested)

```bash
docker build -t mcp/github -f src/github/Dockerfile .
```

## License

MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.

