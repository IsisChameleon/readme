/** Voice session reading mode — determined by bot voice interaction */
export type ReadingMode = 'ai-reads' | 'kid-reads';

/** Sub-view within ai-reads mode */
export type AIReadsView = 'immersive' | 'text-and-image';

/** Voice session connection state */
export type SessionState =
  | 'not-started'
  | 'connecting'
  | 'connected'
  | 'paused'
  | 'ended';

/** A chunk of book text received from the bot via app message */
export interface BookChunkMessage {
  chunkIndex: number;
  chapterTitle?: string;
  paragraphs: string[];
  imageUrl?: string;
}

/** Chapter info for the chapter sidebar */
export interface ChapterInfo {
  id: string;
  title: string;
  firstChunkIndex: number;
}

/** Cover color palette — deterministic pick based on book ID.
 *  Uses the woodland kid palette (see globals.css `--cover-N`). */
export const COVER_COLORS = [
  'var(--cover-1)',
  'var(--cover-2)',
  'var(--cover-3)',
  'var(--cover-4)',
  'var(--cover-5)',
  'var(--cover-6)',
  'var(--cover-7)',
] as const;

export const getCoverColor = (bookId: string): string => {
  let hash = 0;
  for (const char of bookId) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
};
