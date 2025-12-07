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

export const GetPullRequestCommentSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    comment_id: z.number().describe("The ID of the pull request review comment to fetch")
});

export async function getPullRequestComment(
    owner: string,
    repo: string,
    commentId: number
): Promise<z.infer<typeof PullRequestCommentSchema>> {
    const response = await githubRequest(
        `https://api.github.com/repos/${owner}/${repo}/pulls/comments/${commentId}`
    );
    return PullRequestCommentSchema.parse(response);
}

export async function execute(args: z.infer<typeof GetPullRequestCommentSchema>): Promise<z.infer<typeof PullRequestCommentSchema>> {
    return getPullRequestComment(args.owner, args.repo, args.comment_id);
}

const toolSpec: ToolSpec<typeof GetPullRequestCommentSchema> = {
    name: "get_pull_request_comment",
    description: "Get a specific pull request review comment",
    schema: GetPullRequestCommentSchema,
    execute
};

export default toolSpec;
