import { z } from "zod";
import { fetchPullRequestThreads } from "./fetch_pull_request_threads.js";
import { ToolSpec } from "../../common/types.js";

export const GetPullRequestThreadsSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number")
});

export type GetPullRequestThreadsResult = {
    threads: Array<{ id: string; isResolved: boolean; reviewId?: number; firstComment?: string }>;
    success: boolean;
    error?: string;
};

export async function getPullRequestThreads(
    owner: string,
    repo: string,
    pullNumber: number
): Promise<GetPullRequestThreadsResult> {
    try {
        const data = await fetchPullRequestThreads(owner, repo, pullNumber);

        if (data?.repository?.pullRequest?.reviewThreads?.nodes) {
            const allThreads = data.repository.pullRequest.reviewThreads.nodes;
            return {
                threads: allThreads.map((thread: any) => ({
                    id: thread.id,
                    isResolved: thread.isResolved,
                    reviewId: thread.comments?.nodes?.[0]?.pullRequestReview?.databaseId,
                    firstComment: thread.comments?.nodes?.[0]?.bodyText?.substring(0, 100)
                })),
                success: true
            };
        }

        return { threads: [], success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching threads';
        return { threads: [], success: false, error: errorMessage };
    }
}

export async function execute(args: z.infer<typeof GetPullRequestThreadsSchema>): Promise<GetPullRequestThreadsResult> {
    return getPullRequestThreads(args.owner, args.repo, args.pull_number);
}

const toolSpec: ToolSpec<typeof GetPullRequestThreadsSchema> = {
    name: "get_pull_request_threads",
    description: "Get all review threads for a pull request in a single call",
    schema: GetPullRequestThreadsSchema,
    execute
};

export default toolSpec;
