import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as resolveThread from './resolve_pull_request_review_thread.js';

vi.mock('./resolve_pull_request_review_thread.js', async () => {
    const actual = await vi.importActual('./resolve_pull_request_review_thread.js');
    return {
        ...actual,
        resolvePullRequestReviewThread: vi.fn()
    };
});

import { resolvePullRequestReviewThreadsBatch, ResolvePullRequestReviewThreadsBatchSchema, execute } from './resolve_pull_request_review_threads_batch.js';
import toolSpec from './resolve_pull_request_review_threads_batch.js';

describe('resolve_pull_request_review_threads_batch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('schema', () => {
        it('validates correct input with thread_ids array', () => {
            const input = { thread_ids: ['PRRT_1', 'PRRT_2'] };
            const result = ResolvePullRequestReviewThreadsBatchSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('validates empty array', () => {
            const input = { thread_ids: [] };
            const result = ResolvePullRequestReviewThreadsBatchSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('rejects missing thread_ids', () => {
            const input = {};
            const result = ResolvePullRequestReviewThreadsBatchSchema.safeParse(input);
            expect(result.success).toBe(false);
        });

        it('rejects non-array thread_ids', () => {
            const input = { thread_ids: 'PRRT_1' };
            const result = ResolvePullRequestReviewThreadsBatchSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('resolvePullRequestReviewThreadsBatch', () => {
        it('returns empty results for empty input', async () => {
            const result = await resolvePullRequestReviewThreadsBatch([]);

            expect(result.results).toEqual([]);
            expect(result.allSucceeded).toBe(true);
            expect(result.successCount).toBe(0);
            expect(result.failureCount).toBe(0);
        });

        it('resolves all threads successfully', async () => {
            vi.mocked(resolveThread.resolvePullRequestReviewThread)
                .mockResolvedValueOnce({ success: true, message: 'Resolved' })
                .mockResolvedValueOnce({ success: true, message: 'Resolved' });

            const result = await resolvePullRequestReviewThreadsBatch(['PRRT_1', 'PRRT_2']);

            expect(result.results).toHaveLength(2);
            expect(result.allSucceeded).toBe(true);
            expect(result.successCount).toBe(2);
            expect(result.failureCount).toBe(0);
            expect(result.results[0].threadId).toBe('PRRT_1');
            expect(result.results[1].threadId).toBe('PRRT_2');
        });

        it('handles mixed success and failure', async () => {
            vi.mocked(resolveThread.resolvePullRequestReviewThread)
                .mockResolvedValueOnce({ success: true, message: 'Resolved' })
                .mockResolvedValueOnce({ success: false, message: 'Permission denied' })
                .mockResolvedValueOnce({ success: true, message: 'Resolved' });

            const result = await resolvePullRequestReviewThreadsBatch(['PRRT_1', 'PRRT_2', 'PRRT_3']);

            expect(result.results).toHaveLength(3);
            expect(result.allSucceeded).toBe(false);
            expect(result.successCount).toBe(2);
            expect(result.failureCount).toBe(1);
            expect(result.results[1].success).toBe(false);
            expect(result.results[1].message).toBe('Permission denied');
        });

        it('handles all failures', async () => {
            vi.mocked(resolveThread.resolvePullRequestReviewThread)
                .mockResolvedValue({ success: false, message: 'Failed' });

            const result = await resolvePullRequestReviewThreadsBatch(['PRRT_1', 'PRRT_2']);

            expect(result.results).toHaveLength(2);
            expect(result.allSucceeded).toBe(false);
            expect(result.successCount).toBe(0);
            expect(result.failureCount).toBe(2);
        });

        it('calls resolvePullRequestReviewThread for each thread', async () => {
            vi.mocked(resolveThread.resolvePullRequestReviewThread)
                .mockResolvedValue({ success: true, message: 'Resolved' });

            await resolvePullRequestReviewThreadsBatch(['PRRT_1', 'PRRT_2', 'PRRT_3']);

            expect(resolveThread.resolvePullRequestReviewThread).toHaveBeenCalledTimes(3);
            expect(resolveThread.resolvePullRequestReviewThread).toHaveBeenCalledWith('PRRT_1');
            expect(resolveThread.resolvePullRequestReviewThread).toHaveBeenCalledWith('PRRT_2');
            expect(resolveThread.resolvePullRequestReviewThread).toHaveBeenCalledWith('PRRT_3');
        });
    });

    describe('execute', () => {
        it('delegates to resolvePullRequestReviewThreadsBatch', async () => {
            vi.mocked(resolveThread.resolvePullRequestReviewThread)
                .mockResolvedValue({ success: true, message: 'Resolved' });

            const result = await execute({ thread_ids: ['PRRT_1'] });

            expect(result.results).toHaveLength(1);
            expect(result.allSucceeded).toBe(true);
        });
    });

    describe('toolSpec', () => {
        it('has correct name', () => {
            expect(toolSpec.name).toBe('resolve_pull_request_review_threads_batch');
        });

        it('has correct description', () => {
            expect(toolSpec.description).toBe('Resolve multiple pull request review threads in a single call');
        });

        it('has schema', () => {
            expect(toolSpec.schema).toBe(ResolvePullRequestReviewThreadsBatchSchema);
        });
    });
});
