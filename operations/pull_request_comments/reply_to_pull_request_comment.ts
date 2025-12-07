import { z } from "zod";
import { githubRequest } from "../../common/utils.js";
import { GitHubIssueAssigneeSchema, ToolSpec } from "../../common/types.js";

export const PullRequestCommentSchema = z.object({
    url: z.string(),
    id: z.number(),
    node_id: z.string(),
    pull_request_review_id: z.number().nullable(),
    diff_hunk: z.string(),
    path: z.string().nullable(),
    position: z.number().nullable(),
    original_position: z.number().nullable(),
    commit_id: z.string(),
    original_commit_id: z.string(),
    user: GitHubIssueAssigneeSchema,
    body: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    html_url: z.string(),
    pull_request_url: z.string(),
    author_association: z.string(),
    _links: z.object({
        self: z.object({ href: z.string() }),
        html: z.object({ href: z.string() }),
        pull_request: z.object({ href: z.string() })
    })
});

export const ReplyToPullRequestCommentSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
    comment_id: z.number().describe("The ID of the comment to reply to"),
    body: z.string().describe("The text content of the reply")
});

export async function replyToPullRequestComment(
    owner: string,
    repo: string,
    pullNumber: number,
    commentId: number,
    body: string
): Promise<z.infer<typeof PullRequestCommentSchema>> {
    const response = await githubRequest(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/comments/${commentId}/replies`,
        {
            method: 'POST',
            body: { body }
        }
    );
    return PullRequestCommentSchema.parse(response);
}

export async function execute(args: z.infer<typeof ReplyToPullRequestCommentSchema>): Promise<z.infer<typeof PullRequestCommentSchema>> {
    return replyToPullRequestComment(args.owner, args.repo, args.pull_number, args.comment_id, args.body);
}

const toolSpec: ToolSpec<typeof ReplyToPullRequestCommentSchema> = {
    name: "reply_to_pull_request_comment",
    description: "Add a reply to a specific pull request review comment",
    schema: ReplyToPullRequestCommentSchema,
    execute
};

export default toolSpec;
