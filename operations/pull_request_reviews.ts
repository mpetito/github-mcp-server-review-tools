import { z } from "zod";
import { githubRequest } from "../common/utils.js";
import { GitHubIssueAssigneeSchema } from "../common/types.js";

// Schema definitions
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


// Input schemas
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

export const CheckPullRequestReviewResolutionSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  pull_number: z.number().describe("Pull request number"),
  review_id: z.number().describe("The unique identifier of the review")
});

export const GetPullRequestReviewThreadsSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  pull_number: z.number().describe("Pull request number"),
  review_id: z.number().describe("The unique identifier of the review")
});

export const GetPullRequestThreadsSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  pull_number: z.number().describe("Pull request number")
});

export const GetPullRequestThreadSchema = z.object({
  thread_id: z.string().describe("The GraphQL node ID of the review thread")
});

export const ResolvePullRequestReviewThreadSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  pull_number: z.number().describe("Pull request number"),
  thread_id: z.string().describe("The GraphQL node ID of the review thread to resolve")
});

// Function implementations
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


// Helper function to fetch threads with GraphQL
async function fetchPullRequestThreads(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<any> {
  // Use GraphQL to get all review threads for the pull request
  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        pullRequest(number: ${pullNumber}) {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              comments(first: 15) {
                nodes {
                  pullRequestReview {
                    id
                    databaseId
                  }
                  author {
                    login
                  }
                  bodyText
                }
              }
            }
          }
        }
      }
    }
  `;

  const graphqlEndpoint = 'https://api.github.com/graphql';
  const response = await githubRequest(graphqlEndpoint, {
    method: 'POST',
    body: { query }
  });

  return response && typeof response === 'object' && 'data' in response ? response.data : null;
}


export async function getPullRequestThreads(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<{ threads: Array<{ id: string, isResolved: boolean, reviewId?: number, firstComment?: string }> }> {
  try {
    const data = await fetchPullRequestThreads(owner, repo, pullNumber);
    
    if (data?.repository?.pullRequest?.reviewThreads?.nodes) {
      const allThreads = data.repository.pullRequest.reviewThreads.nodes;
      
      // Map threads to a more usable format
      return {
        threads: allThreads.map((thread: any) => ({
          id: thread.id,
          isResolved: thread.isResolved,
          reviewId: thread.comments?.nodes?.[0]?.pullRequestReview?.databaseId,
          firstComment: thread.comments?.nodes?.[0]?.bodyText?.substring(0, 100) // First 100 chars of comment for reference
        }))
      };
    }
    
    return { threads: [] };
  } catch (error) {
    return { threads: [] };
  }
}



export async function resolvePullRequestReviewThread(
  threadId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const query = `
      mutation ResolveReviewThread($input: ResolveReviewThreadInput!) {
        resolveReviewThread(input: $input) {
          thread {
            id
            isResolved
          }
        }
      }
    `;
    
    const variables = {
      input: {
        threadId,
        clientMutationId: `resolve_thread_${Date.now()}`
      }
    };

    const graphqlEndpoint = 'https://api.github.com/graphql';
    const response = await githubRequest(graphqlEndpoint, {
      method: 'POST',
      body: { query, variables }
    }) as Record<string, any>;
    
    if (response?.errors) {
      const errors = response.errors || [];
      if (errors.some((e: any) => e.type === 'FORBIDDEN' || e.message?.includes('Resource not accessible'))) {
        return { success: false, message: "Permission denied: You don't have permission to resolve this thread" };
      }
      
      if (errors.some((e: any) => e.type === 'NOT_FOUND' || e.message?.includes('Could not resolve'))) {
        return { success: false, message: "Thread ID not found or invalid" };
      }
      
      return { success: false, message: `GraphQL error: ${errors.map((e: any) => e.message).join(', ')}` };
    }
    
    return {
      success: !!response?.data?.resolveReviewThread?.thread?.isResolved,
      message: response?.data?.resolveReviewThread?.thread?.isResolved 
        ? "Review thread resolved successfully" 
        : "Failed to resolve thread"
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to resolve review thread: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function getPullRequestThread(
  threadId: string
): Promise<{
  thread: {
    id: string;
    isResolved: boolean;
    comments: Array<{
      id: string;
      databaseId: number;
      body: string;
      author: string;
      createdAt: string;
      reviewId?: number;
    }>;
  } | null;
  success: boolean;
  message: string;
}> {
  try {
    const query = `
      query {
        node(id: "${threadId}") {
          ... on PullRequestReviewThread {
            id
            isResolved
            comments(first: 50) {
              nodes {
                id
                databaseId
                bodyText
                createdAt
                author {
                  login
                }
                pullRequestReview {
                  databaseId
                }
              }
            }
          }
        }
      }
    `;

    const graphqlEndpoint = 'https://api.github.com/graphql';
    const response = await githubRequest(graphqlEndpoint, {
      method: 'POST',
      body: { query }
    }) as Record<string, any>;

    if (response?.errors) {
      const errorMsg = response.errors.some((e: any) => e.type === 'NOT_FOUND' || e.message?.includes('Could not resolve'))
        ? "Thread ID not found or invalid"
        : `GraphQL error: ${response.errors.map((e: any) => e.message).join(', ')}`;
      
      return { thread: null, success: false, message: errorMsg };
    }
    
    const thread = response?.data?.node;
    if (!thread) {
      return { thread: null, success: false, message: "Thread not found" };
    }
    
    return {
      thread: {
        id: thread.id,
        isResolved: thread.isResolved,
        comments: thread.comments.nodes.map((comment: any) => ({
          id: comment.id,
          databaseId: comment.databaseId,
          body: comment.bodyText,
          author: comment.author?.login,
          createdAt: comment.createdAt,
          reviewId: comment.pullRequestReview?.databaseId
        }))
      },
      success: true,
      message: "Thread retrieved successfully"
    };
  } catch (error) {
    return {
      thread: null,
      success: false,
      message: `Failed to fetch thread: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 