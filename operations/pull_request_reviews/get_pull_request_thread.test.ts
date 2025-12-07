import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { getPullRequestThread, GetPullRequestThreadSchema, execute } from './get_pull_request_thread.js';
import toolSpec from './get_pull_request_thread.js';

describe('get_pull_request_thread', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { thread_id: 'PRRT_1' };
            const result = GetPullRequestThreadSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing thread_id', () => {
            const input = {};
            const result = GetPullRequestThreadSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('returns thread details on success', async () => {
            const mockResponse = {
                data: {
                    node: {
                        id: 'PRRT_1',
                        isResolved: false,
                        comments: {
                            nodes: [
                                {
                                    id: 'PRRC_1',
                                    databaseId: 500,
                                    bodyText: 'Please fix this',
                                    createdAt: '2024-01-01T00:00:00Z',
                                    author: { login: 'reviewer' },
                                    pullRequestReview: { databaseId: 100 }
                                }
                            ]
                        }
                    }
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ thread_id: 'PRRT_1' });

            expect(result.success).toBe(true);
            expect(result.thread).not.toBeNull();
            expect(result.thread!.id).toBe('PRRT_1');
            expect(result.thread!.isResolved).toBe(false);
            expect(result.thread!.comments).toHaveLength(1);
            expect(result.thread!.comments[0].body).toBe('Please fix this');
        });

        it('returns error when thread not found', async () => {
            const mockResponse = {
                errors: [
                    { type: 'NOT_FOUND', message: 'Could not resolve to a node' }
                ]
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ thread_id: 'invalid_id' });

            expect(result.success).toBe(false);
            expect(result.thread).toBeNull();
            expect(result.message).toContain('not found');
        });

        it('returns error when node is null', async () => {
            const mockResponse = {
                data: {
                    node: null
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ thread_id: 'PRRT_1' });

            expect(result.success).toBe(false);
            expect(result.thread).toBeNull();
            expect(result.message).toBe('Thread not found');
        });

        it('handles network errors', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('DNS resolution failed'));

            const result = await execute({ thread_id: 'PRRT_1' });

            expect(result.success).toBe(false);
            expect(result.thread).toBeNull();
            expect(result.message).toContain('DNS resolution failed');
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('get_pull_request_thread');
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(GetPullRequestThreadSchema);
        });
    });
});
