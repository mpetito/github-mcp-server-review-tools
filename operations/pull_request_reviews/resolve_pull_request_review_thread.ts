import { z } from "zod";
import { githubRequest } from "../../common/utils.js";
import { ToolSpec } from "../../common/types.js";

export const ResolvePullRequestReviewThreadSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
    thread_id: z.string().describe("The GraphQL node ID of the review thread to resolve")
});

export type ResolvePullRequestReviewThreadResult = {
    success: boolean;
    message: string;
};

export async function resolvePullRequestReviewThread(
    threadId: string
): Promise<ResolvePullRequestReviewThreadResult> {
    try {
        const query = `
      mutation ResolveReviewThread($input: ResolveReviewThreadInput!) {
        resolveReviewThread(input: $input) {
          thread {
            id
            isResolved
          }
        }
      }
    `;

        const variables = {
            input: {
                threadId,
                clientMutationId: `resolve_thread_${Date.now()}`
            }
        };

        const graphqlEndpoint = 'https://api.github.com/graphql';
        const response = await githubRequest(graphqlEndpoint, {
            method: 'POST',
            body: { query, variables }
        }) as Record<string, any>;

        if (response?.errors) {
            const errors = response.errors || [];
            if (errors.some((e: any) => e.type === 'FORBIDDEN' || e.message?.includes('Resource not accessible'))) {
                return { success: false, message: "Permission denied: You don't have permission to resolve this thread" };
            }

            if (errors.some((e: any) => e.type === 'NOT_FOUND' || e.message?.includes('Could not resolve'))) {
                return { success: false, message: "Thread ID not found or invalid" };
            }

            return { success: false, message: `GraphQL error: ${errors.map((e: any) => e.message).join(', ')}` };
        }

        return {
            success: !!response?.data?.resolveReviewThread?.thread?.isResolved,
            message: response?.data?.resolveReviewThread?.thread?.isResolved
                ? "Review thread resolved successfully"
                : "Failed to resolve thread"
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to resolve review thread: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function execute(args: z.infer<typeof ResolvePullRequestReviewThreadSchema>): Promise<ResolvePullRequestReviewThreadResult> {
    return resolvePullRequestReviewThread(args.thread_id);
}

const toolSpec: ToolSpec<typeof ResolvePullRequestReviewThreadSchema> = {
    name: "resolve_pull_request_review_thread",
    description: "Mark a pull request review thread as resolved",
    schema: ResolvePullRequestReviewThreadSchema,
    execute
};

export default toolSpec;
