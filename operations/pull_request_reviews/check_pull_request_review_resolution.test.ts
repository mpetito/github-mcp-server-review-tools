import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { checkPullRequestReviewResolution, CheckPullRequestReviewResolutionSchema, execute } from './check_pull_request_review_resolution.js';
import toolSpec from './check_pull_request_review_resolution.js';

describe('check_pull_request_review_resolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1, review_id: 100 };
            const result = CheckPullRequestReviewResolutionSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing fields', () => {
            const input = { owner: 'owner', repo: 'repo' };
            const result = CheckPullRequestReviewResolutionSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('returns allResolved true when all threads resolved', async () => {
            const mockGraphQLResponse = {
                data: {
                    repository: {
                        pullRequest: {
                            reviewThreads: {
                                nodes: [
                                    {
                                        id: 'PRRT_1',
                                        isResolved: true,
                                        comments: {
                                            nodes: [
                                                { pullRequestReview: { databaseId: 100 }, bodyText: 'Fixed' }
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
            expect(result.allResolved).toBe(true);
            expect(result.totalThreads).toBe(1);
            expect(result.resolvedThreads).toBe(1);
            expect(result.unresolvedThreads).toHaveLength(0);
        });

        it('returns allResolved false with unresolved threads', async () => {
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
                                                { pullRequestReview: { databaseId: 100 }, bodyText: 'Needs work' }
                                            ]
                                        }
                                    },
                                    {
                                        id: 'PRRT_2',
                                        isResolved: true,
                                        comments: {
                                            nodes: [
                                                { pullRequestReview: { databaseId: 100 }, bodyText: 'Done' }
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
            expect(result.allResolved).toBe(false);
            expect(result.totalThreads).toBe(2);
            expect(result.resolvedThreads).toBe(1);
            expect(result.unresolvedThreads).toHaveLength(1);
            expect(result.unresolvedThreads[0].id).toBe('PRRT_1');
        });

        it('returns error state on API failure', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Permission denied'));

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, review_id: 100 });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
            expect(result.allResolved).toBe(false);
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('check_pull_request_review_resolution');
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(CheckPullRequestReviewResolutionSchema);
        });
    });
});
