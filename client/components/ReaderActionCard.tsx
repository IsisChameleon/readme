'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Play } from 'lucide-react';

/** Shared sizing for all strip cards — grow to fill, cap at 32rem */
export const STRIP_CARD_WIDTH = 'md:flex-1 md:min-w-80 md:max-w-[32rem]';

const darken = (hex: string, amt: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amt));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amt));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  progress: number;
}

interface ReaderActionCardProps {
  householdId: string;
  kid: {
    id: string;
    name: string;
    avatar: string | null;
    color: string | null;
  };
  lastBook: KidLastBook | null;
  bookCount: number;
  index: number;
}

export const ReaderActionCard = ({
  householdId,
  kid,
  lastBook,
  bookCount,
  index,
}: ReaderActionCardProps) => {
  const router = useRouter();
  const color = kid.color ?? '#5CB87A';
  const readerHref = `/h/${householdId}/reader/${kid.id}`;

  const isResuming = !!lastBook && lastBook.progress > 0 && lastBook.progress < 100;
  const isFinished = !!lastBook && lastBook.progress >= 100;

  const metaLabel = isResuming ? 'Reading now' : isFinished ? 'Finished!' : 'Ready to begin';
  const title = isResuming || isFinished ? lastBook!.bookTitle : 'Pick a first story';
  const ctaLabel = isResuming ? 'Continue reading' : isFinished ? 'Pick another' : 'Pick a story';
  const CtaIcon = isResuming ? Play : BookOpen;

  const handleCta = () => {
    if (isResuming && lastBook) {
      router.push(`${readerHref}/call?bookId=${lastBook.bookId}`);
    } else {
      router.push(readerHref);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 260, damping: 24 }}
      className={`rounded-2xl border border-border bg-card overflow-hidden ${STRIP_CARD_WIDTH}`}
    >
      <div
        className="relative h-40 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}, ${darken(color, 0.2)})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <Link
          href={readerHref}
          className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30 hover:bg-black/40 transition-colors"
        >
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/80"
            style={{ backgroundColor: color }}
          >
            {kid.avatar ?? kid.name[0]?.toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-white">{kid.name}</span>
          <ChevronRight className="w-3 h-3 text-white/80" />
        </Link>

        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-xs text-white/70 mb-0.5">{metaLabel}</p>
          <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow line-clamp-2">
            {title}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          {isResuming || isFinished ? (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${lastBook!.progress}%`, backgroundColor: color }}
              />
            </div>
          ) : (
            <div className="h-1.5 rounded-full bg-muted/60 border border-dashed border-border" />
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            {isResuming
              ? `${lastBook!.progress}% complete`
              : isFinished
              ? 'Finished — pick another'
              : 'No book started yet'}
          </p>
        </div>

        <button
          onClick={handleCta}
          className="w-full cursor-pointer font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-[0_4px_14px] shadow-accent/30 hover:opacity-90 transition-opacity"
        >
          <CtaIcon className="h-4 w-4" />
          {ctaLabel}
        </button>

        <Link
          href={readerHref}
          className="w-full flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
        >
          <span>
            See all {bookCount} of {kid.name}
            {kid.name.endsWith('s') ? "'" : "'s"} books
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>
    </motion.div>
  );
};
