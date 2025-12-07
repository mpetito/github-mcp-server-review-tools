import { describe, it, expect } from "vitest";
import {
    GitHubError,
    GitHubValidationError,
    GitHubResourceNotFoundError,
    GitHubAuthenticationError,
    GitHubPermissionError,
    GitHubRateLimitError,
    GitHubConflictError,
    isGitHubError,
    createGitHubError,
} from "./errors.js";

describe("GitHubError", () => {
    it("should create a GitHubError with message, status, and response", () => {
        const error = new GitHubError("Test error", 500, { detail: "error" });

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(GitHubError);
        expect(error.message).toBe("Test error");
        expect(error.status).toBe(500);
        expect(error.response).toEqual({ detail: "error" });
        expect(error.name).toBe("GitHubError");
    });
});

describe("GitHubValidationError", () => {
    it("should extend GitHubError with validation-specific name", () => {
        const error = new GitHubValidationError("Validation failed", 422, { errors: [] });

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.name).toBe("GitHubValidationError");
        expect(error.status).toBe(422);
        expect(error.message).toBe("Validation failed");
    });
});

describe("GitHubResourceNotFoundError", () => {
    it("should create a 404 error with resource name", () => {
        const error = new GitHubResourceNotFoundError("Repository");

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.name).toBe("GitHubResourceNotFoundError");
        expect(error.status).toBe(404);
        expect(error.message).toBe("Resource not found: Repository");
        expect(error.response).toEqual({ message: "Repository not found" });
    });
});

describe("GitHubAuthenticationError", () => {
    it("should create a 401 error with default message", () => {
        const error = new GitHubAuthenticationError();

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.name).toBe("GitHubAuthenticationError");
        expect(error.status).toBe(401);
        expect(error.message).toBe("Authentication failed");
    });

    it("should accept custom message", () => {
        const error = new GitHubAuthenticationError("Invalid token");

        expect(error.message).toBe("Invalid token");
    });
});

describe("GitHubPermissionError", () => {
    it("should create a 403 error with default message", () => {
        const error = new GitHubPermissionError();

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.name).toBe("GitHubPermissionError");
        expect(error.status).toBe(403);
        expect(error.message).toBe("Insufficient permissions");
    });

    it("should accept custom message", () => {
        const error = new GitHubPermissionError("Cannot access private repo");

        expect(error.message).toBe("Cannot access private repo");
    });
});

describe("GitHubRateLimitError", () => {
    it("should create a 429 error with reset time", () => {
        const resetAt = new Date("2024-01-01T12:00:00Z");
        const error = new GitHubRateLimitError("Rate limit exceeded", resetAt);

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.name).toBe("GitHubRateLimitError");
        expect(error.status).toBe(429);
        expect(error.message).toBe("Rate limit exceeded");
        expect(error.resetAt).toBe(resetAt);
        expect(error.response).toEqual({
            message: "Rate limit exceeded",
            reset_at: "2024-01-01T12:00:00.000Z",
        });
    });

    it("should use default message", () => {
        const resetAt = new Date();
        const error = new GitHubRateLimitError(undefined, resetAt);

        expect(error.message).toBe("Rate limit exceeded");
    });
});

describe("GitHubConflictError", () => {
    it("should create a 409 error with message", () => {
        const error = new GitHubConflictError("Merge conflict detected");

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.name).toBe("GitHubConflictError");
        expect(error.status).toBe(409);
        expect(error.message).toBe("Merge conflict detected");
        expect(error.response).toEqual({ message: "Merge conflict detected" });
    });
});

describe("isGitHubError", () => {
    it("should return true for GitHubError instances", () => {
        expect(isGitHubError(new GitHubError("test", 500, {}))).toBe(true);
        expect(isGitHubError(new GitHubValidationError("test", 422, {}))).toBe(true);
        expect(isGitHubError(new GitHubResourceNotFoundError("test"))).toBe(true);
        expect(isGitHubError(new GitHubAuthenticationError())).toBe(true);
        expect(isGitHubError(new GitHubPermissionError())).toBe(true);
        expect(isGitHubError(new GitHubRateLimitError("test", new Date()))).toBe(true);
        expect(isGitHubError(new GitHubConflictError("test"))).toBe(true);
    });

    it("should return false for non-GitHubError values", () => {
        expect(isGitHubError(new Error("test"))).toBe(false);
        expect(isGitHubError("string error")).toBe(false);
        expect(isGitHubError(null)).toBe(false);
        expect(isGitHubError(undefined)).toBe(false);
        expect(isGitHubError({})).toBe(false);
        expect(isGitHubError({ status: 500, message: "fake error" })).toBe(false);
    });
});

describe("createGitHubError", () => {
    it("should create GitHubAuthenticationError for 401", () => {
        const error = createGitHubError(401, { message: "Bad credentials" });

        expect(error).toBeInstanceOf(GitHubAuthenticationError);
        expect(error.message).toBe("Bad credentials");
    });

    it("should create GitHubPermissionError for 403", () => {
        const error = createGitHubError(403, { message: "Forbidden" });

        expect(error).toBeInstanceOf(GitHubPermissionError);
        expect(error.message).toBe("Forbidden");
    });

    it("should create GitHubResourceNotFoundError for 404", () => {
        const error = createGitHubError(404, { message: "Not Found" });

        expect(error).toBeInstanceOf(GitHubResourceNotFoundError);
        expect(error.message).toBe("Resource not found: Not Found");
    });

    it("should use default resource name for 404 without message", () => {
        const error = createGitHubError(404, {});

        expect(error).toBeInstanceOf(GitHubResourceNotFoundError);
        expect(error.message).toBe("Resource not found: Resource");
    });

    it("should create GitHubConflictError for 409", () => {
        const error = createGitHubError(409, { message: "Conflict" });

        expect(error).toBeInstanceOf(GitHubConflictError);
        expect(error.message).toBe("Conflict");
    });

    it("should use default message for 409 without message", () => {
        const error = createGitHubError(409, {});

        expect(error).toBeInstanceOf(GitHubConflictError);
        expect(error.message).toBe("Conflict occurred");
    });

    it("should create GitHubValidationError for 422", () => {
        const error = createGitHubError(422, { message: "Validation failed", errors: [] });

        expect(error).toBeInstanceOf(GitHubValidationError);
        expect(error.message).toBe("Validation failed");
    });

    it("should use default message for 422 without message", () => {
        const error = createGitHubError(422, {});

        expect(error).toBeInstanceOf(GitHubValidationError);
        expect(error.message).toBe("Validation failed");
    });

    it("should create GitHubRateLimitError for 429", () => {
        const resetTime = new Date("2024-01-01T12:00:00Z");
        const error = createGitHubError(429, { message: "Too many requests", reset_at: resetTime.toISOString() });

        expect(error).toBeInstanceOf(GitHubRateLimitError);
        expect(error.message).toBe("Too many requests");
        expect((error as GitHubRateLimitError).resetAt).toEqual(resetTime);
    });

    it("should use fallback reset time for 429 without reset_at", () => {
        const beforeCreate = Date.now();
        const error = createGitHubError(429, {}) as GitHubRateLimitError;
        const afterCreate = Date.now();

        expect(error).toBeInstanceOf(GitHubRateLimitError);
        // Reset time should be approximately 60 seconds from now
        expect(error.resetAt.getTime()).toBeGreaterThanOrEqual(beforeCreate + 60000);
        expect(error.resetAt.getTime()).toBeLessThanOrEqual(afterCreate + 60000);
    });

    it("should create generic GitHubError for unknown status codes", () => {
        const error = createGitHubError(500, { message: "Internal Server Error" });

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.name).toBe("GitHubError");
        expect(error.message).toBe("Internal Server Error");
        expect(error.status).toBe(500);
    });

    it("should use default message for unknown status without message", () => {
        const error = createGitHubError(503, {});

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.message).toBe("GitHub API error");
    });

    it("should handle null response", () => {
        const error = createGitHubError(500, null);

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.message).toBe("GitHub API error");
    });

    it("should handle undefined response", () => {
        const error = createGitHubError(500, undefined);

        expect(error).toBeInstanceOf(GitHubError);
        expect(error.message).toBe("GitHub API error");
    });
});
