import { z } from "zod";
import { githubRequest } from "../../common/utils.js";
import { GitHubIssueAssigneeSchema, ToolSpec } from "../../common/types.js";

export const PullRequestReviewSchema = z.object({
    id: z.number(),
    node_id: z.string(),
    user: GitHubIssueAssigneeSchema,
    body: z.string().nullable(),
    state: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED', 'PENDING']),
    html_url: z.string(),
    pull_request_url: z.string(),
    commit_id: z.string(),
    submitted_at: z.string().nullable(),
    author_association: z.string()
});

export const CreatePullRequestReviewSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
    commit_id: z.string().optional().describe("The SHA of the commit that needs a review"),
    body: z.string().describe("The body text of the review"),
    event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT']).describe("The review action to perform"),
    comments: z.array(z.object({
        path: z.string().describe("The relative path to the file being commented on"),
        position: z.number().describe("The position in the diff where you want to add a review comment"),
        body: z.string().describe("Text of the review comment")
    })).optional().describe("Comments to post as part of the review")
});

export const GetPullRequestReviewSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number"),
    review_id: z.number().describe("The unique identifier of the review")
});

export const GetPullRequestReviewsSchema = z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    pull_number: z.number().describe("Pull request number")
});

export async function getPullRequestReview(
    owner: string,
    repo: string,
    pullNumber: number,
    reviewId: number
): Promise<z.infer<typeof PullRequestReviewSchema>> {
    const response = await githubRequest(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews/${reviewId}`
    );
    return PullRequestReviewSchema.parse(response);
}

export async function execute(args: z.infer<typeof GetPullRequestReviewSchema>): Promise<z.infer<typeof PullRequestReviewSchema>> {
    return getPullRequestReview(args.owner, args.repo, args.pull_number, args.review_id);
}

const toolSpec: ToolSpec<typeof GetPullRequestReviewSchema> = {
    name: "get_pull_request_review",
    description: "Get a specific pull request review",
    schema: GetPullRequestReviewSchema,
    execute
};

export default toolSpec;
