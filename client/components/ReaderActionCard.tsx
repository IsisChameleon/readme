'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

/** Woodland kid palette — deterministic color from a string */
const PALETTE = ['#E9A55F', '#5CB87A', '#6B8FD4', '#C56B8A', '#8FB56A', '#8B6DAF', '#5BAEC4'];

const colorFromString = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

/** Shared sizing for all strip cards — grow to fill, cap at 32rem */
export const STRIP_CARD_WIDTH = 'md:flex-1 md:min-w-80 md:max-w-[32rem]';

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  coverUrl: string | null;
  progress: number;
}

interface ReadyBook {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
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
  readyBooks: ReadyBook[];
  index: number;
}

export const ReaderActionCard = ({
  householdId,
  kid,
  lastBook,
  readyBooks,
  index,
}: ReaderActionCardProps) => {
  const router = useRouter();
  const color = kid.color ?? '#5CB87A';

  const isResuming = lastBook && lastBook.progress > 0 && lastBook.progress < 100;
  const isSingleBook = readyBooks.length === 1 && !isResuming && !lastBook;
  const singleBook = isSingleBook ? readyBooks[0] : null;

  const coverUrl = isResuming ? lastBook.coverUrl : singleBook?.cover_image_url ?? null;
  const bookTitle = isResuming ? lastBook.bookTitle : singleBook?.title ?? null;
  const bookAuthor = singleBook?.author ?? null;
  const placeholderColor = bookTitle ? colorFromString(bookTitle) : color;

  const handleAction = () => {
    if (isResuming) {
      router.push(`/h/${householdId}/reader/${kid.id}/call?bookId=${lastBook.bookId}`);
    } else if (singleBook) {
      router.push(`/h/${householdId}/reader/${kid.id}/call?bookId=${singleBook.id}`);
    } else {
      router.push(`/h/${householdId}/reader/${kid.id}`);
    }
  };

  return (
    <motion.button
      onClick={handleAction}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full rounded-2xl border border-border bg-card text-left overflow-hidden cursor-pointer transition-all hover:border-primary ${STRIP_CARD_WIDTH}`}
    >
      <div className="relative h-44 overflow-hidden">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookPlaceholder title={bookTitle} author={bookAuthor} color={placeholderColor} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute bottom-3 left-4 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold text-white ring-2 ring-white/80"
            style={{ backgroundColor: color }}
          >
            {kid.avatar ?? kid.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-[family-name:var(--font-marcellus)] text-base font-bold text-white">
              {kid.name}
            </p>
            <p className="text-xs text-white/80">
              {isResuming
                ? 'Reading now'
                : singleBook
                ? 'New book ready'
                : readyBooks.length > 0
                ? `${readyBooks.length} books`
                : 'No books yet'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {isResuming ? (
          <>
            <p className="font-[family-name:var(--font-marcellus)] font-semibold truncate">
              {lastBook.bookTitle}
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${lastBook.progress}%`, backgroundColor: color }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{lastBook.progress}% complete</span>
              <span className="text-sm font-semibold" style={{ color }}>
                Continue &rarr;
              </span>
            </div>
          </>
        ) : singleBook ? (
          <>
            <p className="font-[family-name:var(--font-marcellus)] font-semibold truncate">
              {singleBook.title}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {singleBook.author && singleBook.author !== 'Unknown' ? `by ${singleBook.author}` : ''}
              </span>
              <span className="text-sm font-semibold" style={{ color }}>
                Start reading &rarr;
              </span>
            </div>
          </>
        ) : readyBooks.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {lastBook?.progress === 100 ? 'Finished! Pick another' : `${readyBooks.length} books`}
            </span>
            <span className="text-sm font-semibold" style={{ color }}>
              Browse &rarr;
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Upload a book to get started</p>
        )}
      </div>
    </motion.button>
  );
};

const BookPlaceholder = ({
  title,
  author,
  color,
}: {
  title: string | null;
  author: string | null;
  color: string;
}) => (
  <div
    className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
    style={{ backgroundColor: color }}
  >
    <BookOpen className="w-10 h-10 text-white/40 mb-3" />
    {title && (
      <p className="font-[family-name:var(--font-marcellus)] text-white/90 font-bold text-sm leading-tight line-clamp-2">
        {title}
      </p>
    )}
    {author && author !== 'Unknown' && (
      <p className="text-white/60 text-xs mt-1 truncate max-w-full">{author}</p>
    )}
  </div>
);
