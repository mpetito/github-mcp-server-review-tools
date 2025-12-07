import { z } from "zod";
import { githubRequest } from "../../common/utils.js";
import { ToolSpec } from "../../common/types.js";

export const GetPullRequestThreadSchema = z.object({
    thread_id: z.string().describe("The GraphQL node ID of the review thread")
});

export type ThreadComment = {
    id: string;
    databaseId: number;
    body: string;
    author: string;
    createdAt: string;
    reviewId?: number;
};

export type GetPullRequestThreadResult = {
    thread: {
        id: string;
        isResolved: boolean;
        comments: ThreadComment[];
    } | null;
    success: boolean;
    message: string;
};

export async function getPullRequestThread(
    threadId: string
): Promise<GetPullRequestThreadResult> {
    try {
        const query = `
      query GetThread($threadId: ID!) {
        node(id: $threadId) {
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
        }
      }
    `;

        const variables = { threadId };
        const graphqlEndpoint = 'https://api.github.com/graphql';
        const response = await githubRequest(graphqlEndpoint, {
            method: 'POST',
            body: { query, variables }
        }) as Record<string, any>;

        if (response?.errors) {
            const errorMsg = response.errors.some((e: any) => e.type === 'NOT_FOUND' || e.message?.includes('Could not resolve'))
                ? "Thread ID not found or invalid"
                : `GraphQL error: ${response.errors.map((e: any) => e.message).join(', ')}`;

            return { thread: null, success: false, message: errorMsg };
        }

        const thread = response?.data?.node;
        if (!thread) {
            return { thread: null, success: false, message: "Thread not found" };
        }

        return {
            thread: {
                id: thread.id,
                isResolved: thread.isResolved,
                comments: thread.comments.nodes.map((comment: any) => ({
                    id: comment.id,
                    databaseId: comment.databaseId,
                    body: comment.bodyText,
                    author: comment.author?.login,
                    createdAt: comment.createdAt,
                    reviewId: comment.pullRequestReview?.databaseId
                }))
            },
            success: true,
            message: "Thread retrieved successfully"
        };
    } catch (error) {
        return {
            thread: null,
            success: false,
            message: `Failed to fetch thread: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function execute(args: z.infer<typeof GetPullRequestThreadSchema>): Promise<GetPullRequestThreadResult> {
    return getPullRequestThread(args.thread_id);
}

const toolSpec: ToolSpec<typeof GetPullRequestThreadSchema> = {
    name: "get_pull_request_thread",
    description: "Get a single pull request review thread with complete comment details",
    schema: GetPullRequestThreadSchema,
    execute
};

export default toolSpec;
