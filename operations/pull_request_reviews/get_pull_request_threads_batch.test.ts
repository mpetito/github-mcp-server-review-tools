import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { getPullRequestThreadsBatch, GetPullRequestThreadsBatchSchema, execute } from './get_pull_request_threads_batch.js';
import toolSpec from './get_pull_request_threads_batch.js';

describe('get_pull_request_threads_batch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('schema', () => {
        it('validates correct input with thread_ids array', () => {
            const input = { thread_ids: ['PRRT_1', 'PRRT_2'] };
            const result = GetPullRequestThreadsBatchSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('validates empty array', () => {
            const input = { thread_ids: [] };
            const result = GetPullRequestThreadsBatchSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing thread_ids', () => {
            const input = {};
            const result = GetPullRequestThreadsBatchSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('getPullRequestThreadsBatch', () => {
        it('returns empty results for empty input', async () => {
            const result = await getPullRequestThreadsBatch([]);

            expect(result.threads).toEqual([]);
            expect(result.errors).toEqual([]);
            expect(result.success).toBe(true);
        });

        it('fetches threads successfully', async () => {
            const mockResponse = {
                data: {
                    thread0: {
                        id: 'PRRT_1',
                        isResolved: false,
                        comments: {
                            nodes: [
                                {
                                    id: 'C_1',
                                    databaseId: 123,
                                    bodyText: 'Comment 1',
                                    createdAt: '2024-01-01T00:00:00Z',
                                    author: { login: 'user1' },
                                    pullRequestReview: { databaseId: 456 }
                                }
                            ]
                        }
                    },
                    thread1: {
                        id: 'PRRT_2',
                        isResolved: true,
                        comments: {
                            nodes: []
                        }
                    }
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await getPullRequestThreadsBatch(['PRRT_1', 'PRRT_2']);

            expect(result.threads).toHaveLength(2);
            expect(result.errors).toHaveLength(0);
            expect(result.success).toBe(true);
            expect(result.threads[0].id).toBe('PRRT_1');
            expect(result.threads[0].isResolved).toBe(false);
            expect(result.threads[0].comments).toHaveLength(1);
            expect(result.threads[0].comments[0].body).toBe('Comment 1');
            expect(result.threads[1].id).toBe('PRRT_2');
            expect(result.threads[1].isResolved).toBe(true);
        });

        it('handles mixed success and not found', async () => {
            const mockResponse = {
                data: {
                    thread0: {
                        id: 'PRRT_1',
                        isResolved: false,
                        comments: { nodes: [] }
                    },
                    thread1: null
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await getPullRequestThreadsBatch(['PRRT_1', 'PRRT_2']);

            expect(result.threads).toHaveLength(1);
            expect(result.errors).toHaveLength(1);
            expect(result.success).toBe(false);
            expect(result.errors[0].threadId).toBe('PRRT_2');
            expect(result.errors[0].message).toBe('Thread not found');
        });

        it('handles GraphQL errors', async () => {
            const mockResponse = {
                errors: [
                    { type: 'FORBIDDEN', message: 'Resource not accessible' }
                ]
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await getPullRequestThreadsBatch(['PRRT_1']);

            expect(result.threads).toHaveLength(0);
            expect(result.errors).toHaveLength(1);
            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('GraphQL error');
        });

        it('handles network error', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Connection timeout'));

            const result = await getPullRequestThreadsBatch(['PRRT_1']);

            expect(result.threads).toHaveLength(0);
            expect(result.errors).toHaveLength(1);
            expect(result.success).toBe(false);
            expect(result.errors[0].message).toContain('Connection timeout');
        });
    });

    describe('execute', () => {
        it('delegates to getPullRequestThreadsBatch', async () => {
            const mockResponse = {
                data: {
                    thread0: {
                        id: 'PRRT_1',
                        isResolved: false,
                        comments: { nodes: [] }
                    }
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockResponse);

            const result = await execute({ thread_ids: ['PRRT_1'] });

            expect(result.threads).toHaveLength(1);
            expect(result.success).toBe(true);
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('get_pull_request_threads_batch');
        });

        it('has correct description', () => {
            expect(toolSpec.description).toBe('Get multiple pull request review threads with complete comment details in a single call');
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(GetPullRequestThreadsBatchSchema);
        });
    });
});
