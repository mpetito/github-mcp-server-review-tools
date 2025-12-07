// Re-export from submodules
export {
    PullRequestCommentSchema,
    GetPullRequestCommentSchema,
    getPullRequestComment
} from "./get_pull_request_comment.js";

export {
    ReplyToPullRequestCommentSchema,
    replyToPullRequestComment
} from "./reply_to_pull_request_comment.js";

// Import and re-export tool specs
import getPullRequestCommentToolSpec from "./get_pull_request_comment.js";
import replyToPullRequestCommentToolSpec from "./reply_to_pull_request_comment.js";

export const toolSpecs = [
    getPullRequestCommentToolSpec,
    replyToPullRequestCommentToolSpec
];
