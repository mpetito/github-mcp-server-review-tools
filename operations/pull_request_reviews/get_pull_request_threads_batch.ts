import { z } from "zod";
import { githubRequest } from "../../common/utils.js";
import { ToolSpec } from "../../common/types.js";

export const GetPullRequestThreadsBatchSchema = z.object({
    thread_ids: z.array(z.string()).describe("Array of GraphQL node IDs of the review threads to fetch")
});

export async function getPullRequestThreadsBatch(
    threadIds: string[]
): Promise<{
    threads: Array<{
        id: string;
        isResolved: boolean;
        comments: Array<{
            id: string;
            databaseId: number;
            body: string;
            author: string;
            createdAt: string;
            reviewId?: number;
        }>;
    }>;
    errors: Array<{ threadId: string; message: string }>;
    success: boolean;
}> {
    if (threadIds.length === 0) {
        return { threads: [], errors: [], success: true };
    }

    try {
        const nodeQueries = threadIds.map((id, index) =>
            `thread${index}: node(id: "${id}") {
        ... on PullRequestReviewThread {
          id
          isResolved
          comments(first: 50) {
            nodes {
              id
              databaseId
              bodyText
              createdAt
              author {
                login
              }
              pullRequestReview {
                databaseId
              }
            }
          }
        }
      }`
        ).join('\n');

        const query = `query GetThreadsBatch { ${nodeQueries} }`;

        const graphqlEndpoint = 'https://api.github.com/graphql';
        const response = await githubRequest(graphqlEndpoint, {
            method: 'POST',
            body: { query }
        }) as Record<string, any>;

        if (response?.errors?.length) {
            const details = response.errors
                .map((e: any) => [e.type, e.message].filter(Boolean).join(': '))
                .join('; ');
            return {
                threads: [],
                errors: [{ threadId: 'batch', message: `GraphQL error: ${details}` }],
                success: false
            };
        }

        const threads: Array<{
            id: string;
            isResolved: boolean;
            comments: Array<{
                id: string;
                databaseId: number;
                body: string;
                author: string;
                createdAt: string;
                reviewId?: number;
            }>;
        }> = [];
        const errors: Array<{ threadId: string; message: string }> = [];

        threadIds.forEach((threadId, index) => {
            const thread = response?.data?.[`thread${index}`];
            if (!thread || !thread.id) {
                errors.push({ threadId, message: 'Thread not found' });
            } else {
                threads.push({
                    id: thread.id,
                    isResolved: thread.isResolved,
                    comments: (thread.comments?.nodes || []).map((comment: any) => ({
                        id: comment.id,
                        databaseId: comment.databaseId,
                        body: comment.bodyText,
                        author: comment.author?.login,
                        createdAt: comment.createdAt,
                        reviewId: comment.pullRequestReview?.databaseId
                    }))
                });
            }
        });

        return {
            threads,
            errors,
            success: errors.length === 0
        };
    } catch (error) {
        return {
            threads: [],
            errors: [{ threadId: 'batch', message: error instanceof Error ? error.message : 'Unknown error' }],
            success: false
        };
    }
}

export async function execute(args: z.infer<typeof GetPullRequestThreadsBatchSchema>) {
    return getPullRequestThreadsBatch(args.thread_ids);
}

const toolSpec: ToolSpec<typeof GetPullRequestThreadsBatchSchema> = {
    name: "get_pull_request_threads_batch",
    description: "Get multiple pull request review threads with complete comment details in a single call",
    schema: GetPullRequestThreadsBatchSchema,
    execute
};

export default toolSpec;
