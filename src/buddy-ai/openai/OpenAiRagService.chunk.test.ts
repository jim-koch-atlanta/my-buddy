import { describe, it, expect } from 'vitest';
import { OpenAiRagService } from './OpenAiRagService';
import { LlmProvider } from '../LlmProvider';

// chunk() doesn't use the LlmProvider, but the constructor requires one.
// A stub satisfies the type without doing any real work.
const stubLlm: LlmProvider = {
    embed: async () => ({ embeddings: [], embeddingModel: 'stub' }),
    generateStructured: async () => {
        throw new Error('stubLlm.generateStructured should not be called in chunk tests');
    },
};

const service = new OpenAiRagService({ llmProvider: stubLlm });

// Mirror the constants in OpenAiRagService so the tests document the contract.
const CHUNK_MAX_SIZE = 1000;
const CHUNK_OVERLAP = 250;

describe('OpenAiRagService.chunk', () => {
    // --- The common case: short content is returned whole, unsplit ---------------
    describe('short content (<= CHUNK_MAX_SIZE)', () => {
        it('returns a single-element array containing the original text', () => {
            const text = 'Jim prefers low-pressure reminders.';
            expect(service.chunk(text)).toEqual([text]);
        });

        it('does not split on paragraph breaks when under the size limit', () => {
            // Two paragraphs, but well under the limit -> still one chunk.
            const text = 'First paragraph.\n\nSecond paragraph.';
            expect(service.chunk(text)).toEqual([text]);
        });

        it('handles an empty string', () => {
            expect(service.chunk('')).toEqual(['']);
        });

        it('treats content exactly at the limit as a single chunk', () => {
            const text = 'a'.repeat(CHUNK_MAX_SIZE); // length === limit, the boundary
            expect(service.chunk(text)).toEqual([text]);
        });
    });

    // --- Long, multi-paragraph content splits on paragraph boundaries ------------
    describe('long content split into paragraphs', () => {
        it('keeps each paragraph as its own chunk when each is under the limit', () => {
            const p1 = 'A'.repeat(600);
            const p2 = 'B'.repeat(600);
            const text = `${p1}\n\n${p2}`; // total > limit, but each paragraph < limit

            const result = service.chunk(text);

            expect(result).toEqual([p1, p2]);
        });

        it('returns chunks that each contain real content, not array indices', () => {
            const p1 = 'A'.repeat(600);
            const p2 = 'B'.repeat(600);
            const result = service.chunk(`${p1}\n\n${p2}`);

            // Guards against the for...in bug: no chunk should be a bare index like "0".
            for (const c of result) {
                expect(c.length).toBeGreaterThan(1);
            }
        });
    });

    // --- A single paragraph longer than the limit uses the rolling window --------
    describe('single paragraph longer than CHUNK_MAX_SIZE', () => {
        it('splits one oversized paragraph into multiple chunks', () => {
            const text = 'a'.repeat(2500); // one long paragraph, no breaks
            const result = service.chunk(text);

            expect(result.length).toBeGreaterThan(1);
        });

        it('each window chunk is no larger than CHUNK_MAX_SIZE', () => {
            const text = 'a'.repeat(2500);
            const result = service.chunk(text);

            for (const c of result) {
                expect(c.length).toBeLessThanOrEqual(CHUNK_MAX_SIZE);
            }
        });

        it('consecutive windows overlap so context is not lost at boundaries', () => {
            // Use a sequence where each position is identifiable.
            const text = Array.from({ length: 2500 }, (_, i) => String(i % 10)).join('');
            const result = service.chunk(text);

            // The end of chunk N should reappear at the start of chunk N+1 (CHUNK_OVERLAP chars).
            const tail = result[0].slice(result[0].length - CHUNK_OVERLAP);
            const head = result[1].slice(0, CHUNK_OVERLAP);
            expect(head).toEqual(tail);
        });

        it('covers the entire input (concatenated chunks, minus overlap, reconstruct it)', () => {
            const text = 'a'.repeat(2500);
            const result = service.chunk(text);

            // Rebuild by stripping the overlap from every chunk after the first.
            let rebuilt = result[0];
            for (let i = 1; i < result.length; i++) {
                rebuilt += result[i].slice(CHUNK_OVERLAP);
            }
            expect(rebuilt).toEqual(text);
        });
    });
});
