import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as utils from '../../common/utils.js';

vi.mock('../../common/utils.js', async () => {
    const actual = await vi.importActual('../../common/utils.js');
    return {
        ...actual,
        githubRequest: vi.fn()
    };
});

import { ReplyToPullRequestCommentSchema, execute } from './reply_to_pull_request_comment.js';
import toolSpec from './reply_to_pull_request_comment.js';

describe('reply_to_pull_request_comment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockComment = {
        url: 'https://api.github.com/repos/owner/repo/pulls/comments/2',
        id: 2,
        node_id: 'PRRC_2',
        pull_request_review_id: 100,
        diff_hunk: '@@ -1,3 +1,4 @@\n line1\n line2\n+line3',
        path: 'src/file.ts',
        position: 5,
        original_position: 5,
        commit_id: 'abc123',
        original_commit_id: 'abc123',
        user: {
            login: 'replier',
            id: 2,
            avatar_url: 'https://example.com/avatar2.png',
            url: 'https://api.github.com/users/replier',
            html_url: 'https://github.com/replier'
        },
        body: 'Thanks for the feedback!',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/owner/repo/pull/1#discussion_r2',
        pull_request_url: 'https://api.github.com/repos/owner/repo/pulls/1',
        author_association: 'CONTRIBUTOR',
        _links: {
            self: { href: 'https://api.github.com/repos/owner/repo/pulls/comments/2' },
            html: { href: 'https://github.com/owner/repo/pull/1#discussion_r2' },
            pull_request: { href: 'https://api.github.com/repos/owner/repo/pulls/1' }
        }
    };

    describe('schema', () => {
        it('validates correct input', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1, comment_id: 1, body: 'Reply text' };
            const result = ReplyToPullRequestCommentSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing body', () => {
            const input = { owner: 'owner', repo: 'repo', pull_number: 1, comment_id: 1 };
            const result = ReplyToPullRequestCommentSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('execute', () => {
        it('creates reply and returns parsed response', async () => {
            vi.mocked(utils.githubRequest).mockResolvedValue(mockComment);

            const result = await execute({
                owner: 'owner',
                repo: 'repo',
                pull_number: 1,
                comment_id: 1,
                body: 'Thanks for the feedback!'
            });

            expect(result.id).toBe(2);
            expect(result.body).toBe('Thanks for the feedback!');
            expect(utils.githubRequest).toHaveBeenCalledWith(
                'https://api.github.com/repos/owner/repo/pulls/1/comments/1/replies',
                {
                    method: 'POST',
                    body: { body: 'Thanks for the feedback!' }
                }
            );
        });

        it('propagates API errors', async () => {
            vi.mocked(utils.githubRequest).mockRejectedValue(new Error('Permission denied'));

            await expect(
                execute({ owner: 'owner', repo: 'repo', pull_number: 1, comment_id: 1, body: 'Reply' })
            ).rejects.toThrow('Permission denied');
        });

        it('handles empty body', async () => {
            const emptyBodyComment = { ...mockComment, body: '' };
            vi.mocked(utils.githubRequest).mockResolvedValue(emptyBodyComment);

            const result = await execute({
                owner: 'owner',
                repo: 'repo',
                pull_number: 1,
                comment_id: 1,
                body: ''
            });

            expect(result.body).toBe('');
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('reply_to_pull_request_comment');
        });

        it('has description', () => {
            expect(toolSpec.description).toBeTruthy();
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(ReplyToPullRequestCommentSchema);
        });

        it('has execute function', () => {
            expect(typeof toolSpec.execute).toBe('function');
        });
    });
});
