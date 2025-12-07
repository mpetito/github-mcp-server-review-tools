import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { getPullRequestComment, GetPullRequestCommentSchema, execute } from './get_pull_request_comment.js';
import toolSpec from './get_pull_request_comment.js';

describe('get_pull_request_comment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockComment = {
        url: 'https://api.github.com/repos/owner/repo/pulls/comments/1',
        id: 1,
        node_id: 'PRRC_1',
        pull_request_review_id: 100,
        diff_hunk: '@@ -1,3 +1,4 @@\n line1\n line2\n+line3',
        path: 'src/file.ts',
        position: 5,
        original_position: 5,
        commit_id: 'abc123',
        original_commit_id: 'abc123',
        user: {
            login: 'reviewer',
            id: 1,
            avatar_url: 'https://example.com/avatar.png',
            url: 'https://api.github.com/users/reviewer',
            html_url: 'https://github.com/reviewer'
        },
        body: 'Please fix this',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/pull/1#discussion_r1',
        pull_request_url: 'https://api.github.com/repos/owner/repo/pulls/1',
        author_association: 'CONTRIBUTOR',
        _links: {
            self: { href: 'https://api.github.com/repos/owner/repo/pulls/comments/1' },
            html: { href: 'https://github.com/owner/repo/pull/1#discussion_r1' },
            pull_request: { href: 'https://api.github.com/repos/owner/repo/pulls/1' }
        }
    };

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { owner: 'owner', repo: 'repo', comment_id: 1 };
            const result = GetPullRequestCommentSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing fields', () => {
            const input = { owner: 'owner', repo: 'repo' };
            const result = GetPullRequestCommentSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('returns parsed comment on success', async () => {
            vi.mocked(utils.githubRequest).mockResolvedValue(mockComment);

            const result = await execute({ owner: 'owner', repo: 'repo', comment_id: 1 });

            expect(result).toEqual(mockComment);
            expect(utils.githubRequest).toHaveBeenCalledWith(
                'https://api.github.com/repos/owner/repo/pulls/comments/1'
            );
        });

        it('propagates network errors', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Network error'));

            await expect(execute({ owner: 'owner', repo: 'repo', comment_id: 1 })).rejects.toThrow('Network error');
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('get_pull_request_comment');
        });

        it('has description', () => {
            expect(toolSpec.description).toBeTruthy();
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(GetPullRequestCommentSchema);
        });

        it('has execute function', () => {
            expect(typeof toolSpec.execute).toBe('function');
        });
    });
});
