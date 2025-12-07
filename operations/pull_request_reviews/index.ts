// Re-export schemas and functions from submodules
export {
    PullRequestReviewSchema,
    CreatePullRequestReviewSchema,
    GetPullRequestReviewSchema,
    GetPullRequestReviewsSchema,
    getPullRequestReview
} from "./get_pull_request_review.js";

export { GetPullRequestThreadsSchema, getPullRequestThreads } from "./get_pull_request_threads.js";
export { GetPullRequestReviewThreadsSchema, getPullRequestReviewThreads } from "./get_pull_request_review_threads.js";
export { CheckPullRequestReviewResolutionSchema, checkPullRequestReviewResolution } from "./check_pull_request_review_resolution.js";
export { ResolvePullRequestReviewThreadSchema, resolvePullRequestReviewThread } from "./resolve_pull_request_review_thread.js";
export { ResolvePullRequestReviewThreadsBatchSchema, resolvePullRequestReviewThreadsBatch } from "./resolve_pull_request_review_threads_batch.js";
export { GetPullRequestThreadSchema, getPullRequestThread } from "./get_pull_request_thread.js";
export { GetPullRequestThreadsBatchSchema, getPullRequestThreadsBatch } from "./get_pull_request_threads_batch.js";

// Import and re-export tool specs
import getPullRequestReviewToolSpec from "./get_pull_request_review.js";
import getPullRequestThreadsToolSpec from "./get_pull_request_threads.js";
import getPullRequestReviewThreadsToolSpec from "./get_pull_request_review_threads.js";
import checkPullRequestReviewResolutionToolSpec from "./check_pull_request_review_resolution.js";
import resolvePullRequestReviewThreadToolSpec from "./resolve_pull_request_review_thread.js";
import resolvePullRequestReviewThreadsBatchToolSpec from "./resolve_pull_request_review_threads_batch.js";
import getPullRequestThreadToolSpec from "./get_pull_request_thread.js";
import getPullRequestThreadsBatchToolSpec from "./get_pull_request_threads_batch.js";

export const toolSpecs = [
    getPullRequestReviewToolSpec,
    getPullRequestThreadsToolSpec,
    getPullRequestReviewThreadsToolSpec,
    checkPullRequestReviewResolutionToolSpec,
    resolvePullRequestReviewThreadToolSpec,
    resolvePullRequestReviewThreadsBatchToolSpec,
    getPullRequestThreadToolSpec,
    getPullRequestThreadsBatchToolSpec
];
