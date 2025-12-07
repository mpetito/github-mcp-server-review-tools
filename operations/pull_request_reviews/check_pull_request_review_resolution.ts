import { z } from "zod";
import { fetchPullRequestThreads } from "./fetch_pull_request_threads.js";
import { ToolSpec } from "../../common/types.js";

export const CheckPullRequestReviewResolutionSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
    review_id: z.number().describe("The unique identifier of the review")
});

export type CheckPullRequestReviewResolutionResult = {
    allResolved: boolean;
    totalThreads: number;
    resolvedThreads: number;
    unresolvedThreads: Array<{ id: string; firstComment?: string }>;
    success: boolean;
    error?: string;
};

export async function checkPullRequestReviewResolution(
    owner: string,
    repo: string,
    pullNumber: number,
    reviewId: number
): Promise<CheckPullRequestReviewResolutionResult> {
    try {
        const data = await fetchPullRequestThreads(owner, repo, pullNumber);

        if (data?.repository?.pullRequest?.reviewThreads?.nodes) {
            const reviewThreads = data.repository.pullRequest.reviewThreads.nodes.filter(
                (thread: any) => thread.comments?.nodes?.some(
                    (comment: any) => comment.pullRequestReview?.databaseId === reviewId
                )
            );

            const resolvedCount = reviewThreads.filter((t: any) => t.isResolved).length;
            const unresolvedThreads = reviewThreads
                .filter((t: any) => !t.isResolved)
                .map((t: any) => ({
                    id: t.id,
                    firstComment: t.comments?.nodes?.[0]?.bodyText?.substring(0, 100)
                }));

            return {
                allResolved: unresolvedThreads.length === 0,
                totalThreads: reviewThreads.length,
                resolvedThreads: resolvedCount,
                unresolvedThreads,
                success: true
            };
        }

        return { allResolved: true, totalThreads: 0, resolvedThreads: 0, unresolvedThreads: [], success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error checking resolution status';
        return { allResolved: false, totalThreads: 0, resolvedThreads: 0, unresolvedThreads: [], success: false, error: errorMessage };
    }
}

export async function execute(args: z.infer<typeof CheckPullRequestReviewResolutionSchema>): Promise<CheckPullRequestReviewResolutionResult> {
    return checkPullRequestReviewResolution(args.owner, args.repo, args.pull_number, args.review_id);
}

const toolSpec: ToolSpec<typeof CheckPullRequestReviewResolutionSchema> = {
    name: "check_pull_request_review_resolution",
    description: "Check if all threads in a pull request review are resolved",
    schema: CheckPullRequestReviewResolutionSchema,
    execute
};

export default toolSpec;
