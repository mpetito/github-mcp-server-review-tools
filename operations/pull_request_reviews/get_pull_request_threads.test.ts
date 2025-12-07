import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { getPullRequestThreads, GetPullRequestThreadsSchema, execute } from './get_pull_request_threads.js';
import toolSpec from './get_pull_request_threads.js';

describe('get_pull_request_threads', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1 };
            const result = GetPullRequestThreadsSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing fields', () => {
            const input = { owner: 'owner', repo: 'repo' };
            const result = GetPullRequestThreadsSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('returns threads on success', async () => {
            const mockGraphQLResponse = {
                data: {
                    repository: {
                        pullRequest: {
                            reviewThreads: {
                                nodes: [
                                    {
                                        id: 'PRRT_1',
                                        isResolved: false,
                                        comments: {
                                            nodes: [
                                                {
                                                    pullRequestReview: { id: 'PRR_1', databaseId: 100 },
                                                    author: { login: 'reviewer' },
                                                    bodyText: 'Please fix this issue'
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        id: 'PRRT_2',
                                        isResolved: true,
                                        comments: {
                                            nodes: [
                                                {
                                                    pullRequestReview: { id: 'PRR_2', databaseId: 101 },
                                                    author: { login: 'reviewer2' },
                                                    bodyText: 'Another comment'
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockGraphQLResponse);

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1 });

            expect(result.success).toBe(true);
            expect(result.threads).toHaveLength(2);
            expect(result.threads[0].id).toBe('PRRT_1');
            expect(result.threads[0].isResolved).toBe(false);
            expect(result.threads[0].reviewId).toBe(100);
            expect(result.threads[1].isResolved).toBe(true);
        });

        it('returns empty threads when no threads exist', async () => {
            const mockGraphQLResponse = {
                data: {
                    repository: {
                        pullRequest: {
                            reviewThreads: {
                                nodes: []
                            }
                        }
                    }
                }
            };

            vi.mocked(utils.githubRequest).mockResolvedValue(mockGraphQLResponse);

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1 });

            expect(result.success).toBe(true);
            expect(result.threads).toHaveLength(0);
        });

        it('returns error on API failure', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Network error'));

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error');
            expect(result.threads).toHaveLength(0);
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('get_pull_request_threads');
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(GetPullRequestThreadsSchema);
        });
    });
});
