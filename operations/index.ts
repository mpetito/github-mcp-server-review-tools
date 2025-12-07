import { ToolSpec } from "../common/types.js";

// Import tool specs from each module
import { toolSpecs as pullRequestReviewsToolSpecs } from "./pull_request_reviews/index.js";
import { toolSpecs as pullRequestCommentsToolSpecs } from "./pull_request_comments/index.js";

// Combined registry of all tool specs
export const toolRegistry: ToolSpec[] = [
    ...pullRequestReviewsToolSpecs,
    ...pullRequestCommentsToolSpecs
];

// Re-export schemas and functions (but not toolSpecs to avoid conflict)
export {
    PullRequestReviewSchema,
    CreatePullRequestReviewSchema,
    GetPullRequestReviewSchema,
    GetPullRequestReviewsSchema,
    getPullRequestReview,
    GetPullRequestThreadsSchema,
    getPullRequestThreads,
    GetPullRequestReviewThreadsSchema,
    getPullRequestReviewThreads,
    CheckPullRequestReviewResolutionSchema,
    checkPullRequestReviewResolution,
    ResolvePullRequestReviewThreadSchema,
    resolvePullRequestReviewThread,
    ResolvePullRequestReviewThreadsBatchSchema,
    resolvePullRequestReviewThreadsBatch,
    GetPullRequestThreadSchema,
    getPullRequestThread,
    GetPullRequestThreadsBatchSchema,
    getPullRequestThreadsBatch
} from "./pull_request_reviews/index.js";

export {
    PullRequestCommentSchema,
    GetPullRequestCommentSchema,
    getPullRequestComment,
    ReplyToPullRequestCommentSchema,
    replyToPullRequestComment
} from "./pull_request_comments/index.js";
