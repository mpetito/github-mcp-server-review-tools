import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { resolvePullRequestReviewThread, ResolvePullRequestReviewThreadSchema, execute } from './resolve_pull_request_review_thread.js';
import toolSpec from './resolve_pull_request_review_thread.js';

describe('resolve_pull_request_review_thread', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1, thread_id: 'PRRT_1' };
            const result = ResolvePullRequestReviewThreadSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing thread_id', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1 };
            const result = ResolvePullRequestReviewThreadSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('returns success when thread resolved', async () => {
            const mockResponse = {
                data: {
                    resolveReviewThread: {
                        thread: {
                            id: 'PRRT_1',
                            isResolved: true
                        }
                    }
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, thread_id: 'PRRT_1' });

            expect(result.success).toBe(true);
            expect(result.message).toBe('Review thread resolved successfully');
        });

        it('returns failure when resolution fails', async () => {
            const mockResponse = {
                data: {
                    resolveReviewThread: {
                        thread: {
                            id: 'PRRT_1',
                            isResolved: false
                        }
                    }
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, thread_id: 'PRRT_1' });

            expect(result.success).toBe(false);
            expect(result.message).toBe('Failed to resolve thread');
        });

        it('handles permission denied error', async () => {
            const mockResponse = {
                errors: [
                    { type: 'FORBIDDEN', message: 'Resource not accessible by integration' }
                ]
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, thread_id: 'PRRT_1' });

            expect(result.success).toBe(false);
            expect(result.message).toContain('Permission denied');
        });

        it('handles not found error', async () => {
            const mockResponse = {
                errors: [
                    { type: 'NOT_FOUND', message: 'Could not resolve to a node' }
                ]
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, thread_id: 'invalid_id' });

            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
        });

        it('handles network error', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Connection timeout'));

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, thread_id: 'PRRT_1' });

            expect(result.success).toBe(false);
            expect(result.message).toContain('Connection timeout');
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('resolve_pull_request_review_thread');
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(ResolvePullRequestReviewThreadSchema);
        });
    });
});
