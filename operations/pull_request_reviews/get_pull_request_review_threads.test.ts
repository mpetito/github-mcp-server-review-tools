import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { GetPullRequestReviewThreadsSchema, execute } from './get_pull_request_review_threads.js';
import toolSpec from './get_pull_request_review_threads.js';

describe('get_pull_request_review_threads', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1, review_id: 100 };
            const result = GetPullRequestReviewThreadsSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing review_id', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1 };
            const result = GetPullRequestReviewThreadsSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('filters threads by review ID', async () => {
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
                                                { pullRequestReview: { databaseId: 100 }, bodyText: 'Comment A' }
                                            ]
                                        }
                                    },
                                    {
                                        id: 'PRRT_2',
                                        isResolved: true,
                                        comments: {
                                            nodes: [
                                                { pullRequestReview: { databaseId: 200 }, bodyText: 'Comment B' }
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

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, review_id: 100 });

            expect(result.success).toBe(true);
            expect(result.threads).toHaveLength(1);
            expect(result.threads[0].id).toBe('PRRT_1');
        });

        it('returns error on API failure', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Auth failed'));

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, review_id: 100 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Auth failed');
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('get_pull_request_review_threads');
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(GetPullRequestReviewThreadsSchema);
        });
    });
});
