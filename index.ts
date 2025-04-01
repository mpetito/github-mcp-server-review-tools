#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  GitHubError,
  GitHubValidationError,
  GitHubResourceNotFoundError,
  GitHubAuthenticationError,
  GitHubPermissionError,
  GitHubRateLimitError,
  GitHubConflictError,
  isGitHubError,
} from './common/errors.js';


// Import the new modules
import * as pullRequestComments from "./operations/pull_request_comments.js";
import * as pullRequestReviews from "./operations/pull_request_reviews.js";

const server = new Server(
  {
    name: "github-mcp-server-review-tools",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

function formatGitHubError(error: GitHubError): string {
  let message = `GitHub API Error: ${error.message}`;
  
  if (error instanceof GitHubValidationError) {
    message = `Validation Error: ${error.message}`;
    if (error.response) {
      message += `\nDetails: ${JSON.stringify(error.response)}`;
    }
  } else if (error instanceof GitHubResourceNotFoundError) {
    message = `Not Found: ${error.message}`;
  } else if (error instanceof GitHubAuthenticationError) {
    message = `Authentication Failed: ${error.message}`;
  } else if (error instanceof GitHubPermissionError) {
    message = `Permission Denied: ${error.message}`;
  } else if (error instanceof GitHubRateLimitError) {
    message = `Rate Limit Exceeded: ${error.message}\nResets at: ${error.resetAt.toISOString()}`;
  } else if (error instanceof GitHubConflictError) {
    message = `Conflict: ${error.message}`;
  }

  return message;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_pull_request_review",
        description: "Get a specific pull request review",
        inputSchema: zodToJsonSchema(pullRequestReviews.GetPullRequestReviewSchema)
      },
      {
        name: "get_pull_request_comment",
        description: "Get a specific pull request review comment",
        inputSchema: zodToJsonSchema(pullRequestComments.GetPullRequestCommentSchema)
      },
      {
        name: "reply_to_pull_request_comment",
        description: "Add a reply to a specific pull request review comment",
        inputSchema: zodToJsonSchema(pullRequestComments.ReplyToPullRequestCommentSchema)
      },
      {
        name: "resolve_pull_request_review_thread",
        description: "Mark a pull request review thread as resolved",
        inputSchema: zodToJsonSchema(pullRequestReviews.ResolvePullRequestReviewThreadSchema)
      },
      {
        name: "check_pull_request_review_resolution",
        description: "Check if all threads in a pull request review are resolved",
        inputSchema: zodToJsonSchema(pullRequestReviews.CheckPullRequestReviewResolutionSchema)
      },
      {
        name: "get_pull_request_review_threads",
        description: "Get the threads in a specific pull request review",
        inputSchema: zodToJsonSchema(pullRequestReviews.GetPullRequestReviewThreadsSchema)
      },
      {
        name: "get_pull_request_threads",
        description: "Get all review threads for a pull request in a single call",
        inputSchema: zodToJsonSchema(pullRequestReviews.GetPullRequestThreadsSchema)
      },
      {
        name: "get_pull_request_thread",
        description: "Get a single pull request review thread with complete comment details",
        inputSchema: zodToJsonSchema(pullRequestReviews.GetPullRequestThreadSchema)
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "get_pull_request_review": {
        const args = pullRequestReviews.GetPullRequestReviewSchema.parse(request.params.arguments);
        const review = await pullRequestReviews.getPullRequestReview(
          args.owner,
          args.repo,
          args.pull_number,
          args.review_id
        );
        return {
          content: [{ type: "text", text: JSON.stringify(review, null, 2) }],
        };
      }

      case "get_pull_request_comment": {
        const args = pullRequestComments.GetPullRequestCommentSchema.parse(request.params.arguments);
        const comment = await pullRequestComments.getPullRequestComment(
          args.owner,
          args.repo,
          args.comment_id
        );
        return {
          content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
        };
      }

      case "reply_to_pull_request_comment": {
        const args = pullRequestComments.ReplyToPullRequestCommentSchema.parse(request.params.arguments);
        const comment = await pullRequestComments.replyToPullRequestComment(
          args.owner,
          args.repo,
          args.pull_number,
          args.comment_id,
          args.body
        );
        return {
          content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
        };
      }

      case "resolve_pull_request_review_thread": {
        const args = pullRequestReviews.ResolvePullRequestReviewThreadSchema.parse(request.params.arguments);
        try {
          const result = await pullRequestReviews.resolvePullRequestReviewThread(
            args.thread_id
          );
          
          // Remove debug info from the response unless specifically requested
          const cleanResult = {
            success: result.success,
            message: result.message
          };
          
          return {
            content: [{ type: "text", text: JSON.stringify(cleanResult, null, 2) }],
          };
        } catch (error) {
          // This should not happen with the new implementation, but just in case
          throw new Error(`Failed to resolve review thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      case "get_pull_request_threads": {
        const args = pullRequestReviews.GetPullRequestThreadsSchema.parse(request.params.arguments);
        const threads = await pullRequestReviews.getPullRequestThreads(
          args.owner,
          args.repo,
          args.pull_number
        );
        return {
          content: [{ type: "text", text: JSON.stringify(threads, null, 2) }],
        };
      }

      case "get_pull_request_thread": {
        const args = pullRequestReviews.GetPullRequestThreadSchema.parse(request.params.arguments);
        const thread = await pullRequestReviews.getPullRequestThread(args.thread_id);
        return {
          content: [{ type: "text", text: JSON.stringify(thread, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isGitHubError(error)) {
      throw new Error(formatGitHubError(error));
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});