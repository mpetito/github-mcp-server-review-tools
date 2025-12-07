import { githubRequest } from "../../common/utils.js";

/**
 * Shared helper to fetch review threads for a pull request via GraphQL.
 * Keeps a single call site for thread fetching so tools can reuse it.
 */
export async function fetchPullRequestThreads(
    owner: string,
    repo: string,
    pullNumber: number
): Promise<any> {
    const query = `
    query GetPullRequestThreads($owner: String!, $repo: String!, $pullNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $pullNumber) {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              comments(first: 15) {
                nodes {
                  pullRequestReview {
                    id
                    databaseId
                  }
                  author {
                    login
                  }
                  bodyText
                }
              }
            }
          }
        }
      }
    }
  `;

    const variables = { owner, repo, pullNumber };
    const graphqlEndpoint = 'https://api.github.com/graphql';

    const response = await githubRequest(graphqlEndpoint, {
        method: 'POST',
        body: { query, variables }
    }) as Record<string, any>;

    if (response?.errors?.length) {
        const details = response.errors
            .map((e: any) => [e.type, e.message].filter(Boolean).join(': '))
            .join('; ');
        throw new Error(`GraphQL error while fetching review threads: ${details || 'Unknown error'}`);
    }

    return response && typeof response === 'object' && 'data' in response ? response.data : null;
}
