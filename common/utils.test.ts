import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    buildUrl,
    validateBranchName,
    validateRepositoryName,
    validateOwnerName
} from './utils.js';

describe('utils', () => {
    describe('buildUrl', () => {
        it('appends query parameters to URL', () => {
            const result = buildUrl('https://api.github.com/repos', {
                page: 1,
                per_page: 30
            });

            expect(result).toBe('https://api.github.com/repos?page=1&per_page=30');
        });

        it('skips undefined parameters', () => {
            const result = buildUrl('https://api.github.com/repos', {
                page: 1,
                filter: undefined
            });

            expect(result).toBe('https://api.github.com/repos?page=1');
        });

        it('handles empty params object', () => {
            const result = buildUrl('https://api.github.com/repos', {});

            expect(result).toBe('https://api.github.com/repos');
        });

        it('handles string parameters', () => {
            const result = buildUrl('https://api.github.com/search', {
                q: 'test query',
                sort: 'stars'
            });

            expect(result).toBe('https://api.github.com/search?q=test+query&sort=stars');
        });
    });

    describe('validateBranchName', () => {
        it('accepts valid branch names', () => {
            expect(validateBranchName('main')).toBe('main');
            expect(validateBranchName('feature/add-tests')).toBe('feature/add-tests');
            expect(validateBranchName('release-1.0.0')).toBe('release-1.0.0');
        });

        it('trims whitespace', () => {
            expect(validateBranchName('  main  ')).toBe('main');
        });

        it('rejects empty branch names', () => {
            expect(() => validateBranchName('')).toThrow('Branch name cannot be empty');
            expect(() => validateBranchName('   ')).toThrow('Branch name cannot be empty');
        });

        it('rejects branch names with ".."', () => {
            expect(() => validateBranchName('feature..test')).toThrow("Branch name cannot contain '..'");
        });

        it('rejects branch names with invalid characters', () => {
            expect(() => validateBranchName('feature~test')).toThrow('Branch name contains invalid characters');
            expect(() => validateBranchName('feature^test')).toThrow('Branch name contains invalid characters');
            expect(() => validateBranchName('feature:test')).toThrow('Branch name contains invalid characters');
            expect(() => validateBranchName('feature?test')).toThrow('Branch name contains invalid characters');
            expect(() => validateBranchName('feature*test')).toThrow('Branch name contains invalid characters');
            expect(() => validateBranchName('feature[test')).toThrow('Branch name contains invalid characters');
            expect(() => validateBranchName('feature test')).toThrow('Branch name contains invalid characters');
        });

        it('rejects branch names starting or ending with "/"', () => {
            expect(() => validateBranchName('/feature')).toThrow("Branch name cannot start or end with '/'");
            expect(() => validateBranchName('feature/')).toThrow("Branch name cannot start or end with '/'");
        });

        it('rejects branch names ending with ".lock"', () => {
            expect(() => validateBranchName('feature.lock')).toThrow("Branch name cannot end with '.lock'");
        });
    });

    describe('validateRepositoryName', () => {
        it('accepts valid repository names', () => {
            expect(validateRepositoryName('my-repo')).toBe('my-repo');
            expect(validateRepositoryName('repo_123')).toBe('repo_123');
            expect(validateRepositoryName('repo.name')).toBe('repo.name');
        });

        it('converts to lowercase', () => {
            expect(validateRepositoryName('MyRepo')).toBe('myrepo');
        });

        it('trims whitespace', () => {
            expect(validateRepositoryName('  myrepo  ')).toBe('myrepo');
        });

        it('rejects empty repository names', () => {
            expect(() => validateRepositoryName('')).toThrow('Repository name cannot be empty');
            expect(() => validateRepositoryName('   ')).toThrow('Repository name cannot be empty');
        });

        it('rejects invalid characters', () => {
            expect(() => validateRepositoryName('repo@name')).toThrow('Repository name can only contain');
            expect(() => validateRepositoryName('repo/name')).toThrow('Repository name can only contain');
        });

        it('rejects names starting or ending with period', () => {
            expect(() => validateRepositoryName('.repo')).toThrow('Repository name cannot start or end with a period');
            expect(() => validateRepositoryName('repo.')).toThrow('Repository name cannot start or end with a period');
        });
    });

    describe('validateOwnerName', () => {
        it('accepts valid owner names', () => {
            expect(validateOwnerName('myuser')).toBe('myuser');
            expect(validateOwnerName('user123')).toBe('user123');
            expect(validateOwnerName('my-org')).toBe('my-org');
        });

        it('converts to lowercase', () => {
            expect(validateOwnerName('MyUser')).toBe('myuser');
        });

        it('trims whitespace', () => {
            expect(validateOwnerName('  myuser  ')).toBe('myuser');
        });

        it('rejects empty owner names', () => {
            expect(() => validateOwnerName('')).toThrow('Owner name cannot be empty');
            expect(() => validateOwnerName('   ')).toThrow('Owner name cannot be empty');
        });

        it('rejects names starting with hyphen', () => {
            expect(() => validateOwnerName('-user')).toThrow('Owner name must start with a letter or number');
        });

        it('rejects names with consecutive hyphens', () => {
            expect(() => validateOwnerName('user--name')).toThrow('Owner name must start with a letter or number');
        });

        it('rejects names longer than 39 characters', () => {
            const longName = 'a'.repeat(40);
            expect(() => validateOwnerName(longName)).toThrow('Owner name must start with a letter or number');
        });

        it('accepts names exactly 39 characters', () => {
            const validName = 'a'.repeat(39);
            expect(validateOwnerName(validName)).toBe(validName);
        });
    });
});
