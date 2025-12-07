import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { GetPullRequestReviewSchema, execute } from './get_pull_request_review.js';
import toolSpec from './get_pull_request_review.js';

describe('get_pull_request_review', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockReview = {
        id: 123,
        node_id: 'PRR_123',
        user: {
            login: 'testuser',
            id: 1,
            avatar_url: 'https://example.com/avatar.png',
            url: 'https://api.github.com/users/testuser',
            html_url: 'https://github.com/testuser'
        },
        body: 'LGTM',
        state: 'APPROVED',
        html_url: 'https://github.com/owner/repo/pull/1#pullrequestreview-123',
        pull_request_url: 'https://api.github.com/repos/owner/repo/pulls/1',
        commit_id: 'abc123',
        submitted_at: '2024-01-01T00:00:00Z',
        author_association: 'CONTRIBUTOR'
    };

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1, review_id: 123 };
            const result = GetPullRequestReviewSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing fields', () => {
            const input = { owner: 'owner', repo: 'repo' };
            const result = GetPullRequestReviewSchema.safeParse(input);
            expect(result.success).toBe(false);
        });

        it('rejects wrong types', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: '1', review_id: 123 };
            const result = GetPullRequestReviewSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('returns parsed review on success', async () => {
            vi.mocked(utils.githubRequest).mockResolvedValue(mockReview);

            const result = await execute({ owner: 'owner', repo: 'repo', pull_number: 1, review_id: 123 });

            expect(result).toEqual(mockReview);
            expect(utils.githubRequest).toHaveBeenCalledWith(
                'https://api.github.com/repos/owner/repo/pulls/1/reviews/123'
            );
        });

        it('propagates network errors', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Network error'));

            await expect(execute({ owner: 'owner', repo: 'repo', pull_number: 1, review_id: 123 })).rejects.toThrow('Network error');
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('get_pull_request_review');
        });

        it('has description', () => {
            expect(toolSpec.description).toBeTruthy();
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(GetPullRequestReviewSchema);
        });

        it('has execute function', () => {
            expect(typeof toolSpec.execute).toBe('function');
        });
    });
});
