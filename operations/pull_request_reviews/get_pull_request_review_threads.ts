import { z } from "zod";
import { fetchPullRequestThreads } from "./fetch_pull_request_threads.js";
import { ToolSpec } from "../../common/types.js";

export const GetPullRequestReviewThreadsSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
    review_id: z.number().describe("The unique identifier of the review")
});

export type GetPullRequestReviewThreadsResult = {
    threads: Array<{ id: string; isResolved: boolean; firstComment?: string }>;
    success: boolean;
    error?: string;
};

export async function getPullRequestReviewThreads(
    owner: string,
    repo: string,
    pullNumber: number,
    reviewId: number
): Promise<GetPullRequestReviewThreadsResult> {
    try {
        const data = await fetchPullRequestThreads(owner, repo, pullNumber);

        if (data?.repository?.pullRequest?.reviewThreads?.nodes) {
            const reviewThreads = data.repository.pullRequest.reviewThreads.nodes.filter(
                (thread: any) => thread.comments?.nodes?.some(
                    (comment: any) => comment.pullRequestReview?.databaseId === reviewId
                )
            );

            return {
                threads: reviewThreads.map((thread: any) => ({
                    id: thread.id,
                    isResolved: thread.isResolved,
                    firstComment: thread.comments?.nodes?.[0]?.bodyText?.substring(0, 100)
                })),
                success: true
            };
        }

        return { threads: [], success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching review threads';
        return { threads: [], success: false, error: errorMessage };
    }
}

export async function execute(args: z.infer<typeof GetPullRequestReviewThreadsSchema>): Promise<GetPullRequestReviewThreadsResult> {
    return getPullRequestReviewThreads(args.owner, args.repo, args.pull_number, args.review_id);
}

const toolSpec: ToolSpec<typeof GetPullRequestReviewThreadsSchema> = {
    name: "get_pull_request_review_threads",
    description: "Get the threads in a specific pull request review",
    schema: GetPullRequestReviewThreadsSchema,
    execute
};

export default toolSpec;
