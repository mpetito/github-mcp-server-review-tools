import { z } from "zod";
import { resolvePullRequestReviewThread } from "./resolve_pull_request_review_thread.js";
import { ToolSpec } from "../../common/types.js";

export const ResolvePullRequestReviewThreadsBatchSchema = z.object({
    thread_ids: z.array(z.string()).describe("Array of GraphQL node IDs of the review threads to resolve")
});

export async function resolvePullRequestReviewThreadsBatch(
    threadIds: string[]
): Promise<{
    results: Array<{ threadId: string; success: boolean; message: string }>;
    allSucceeded: boolean;
    successCount: number;
    failureCount: number;
}> {
    if (threadIds.length === 0) {
        return { results: [], allSucceeded: true, successCount: 0, failureCount: 0 };
    }

    const results = await Promise.all(
        threadIds.map(async (threadId) => {
            const result = await resolvePullRequestReviewThread(threadId);
            return { threadId, ...result };
        })
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return {
        results,
        allSucceeded: failureCount === 0,
        successCount,
        failureCount
    };
}

export async function execute(args: z.infer<typeof ResolvePullRequestReviewThreadsBatchSchema>) {
    return resolvePullRequestReviewThreadsBatch(args.thread_ids);
}

const toolSpec: ToolSpec<typeof ResolvePullRequestReviewThreadsBatchSchema> = {
    name: "resolve_pull_request_review_threads_batch",
    description: "Resolve multiple pull request review threads in a single call",
    schema: ResolvePullRequestReviewThreadsBatchSchema,
    execute
};

export default toolSpec;
