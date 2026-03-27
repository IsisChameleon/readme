'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart3, ArrowLeft, Clock, BookMarked } from 'lucide-react';
import { KidSelector } from '@/components/KidSelector';
import { AddKidDialog } from '@/components/AddKidDialog';
import { EditKidDialog } from '@/components/EditKidDialog';
import { BookCard } from '@/components/BookCard';
import { BookUpload } from '@/components/BookUpload';
import { SignOutButton } from '@/components/SignOutButton';
import { createClient } from '@/lib/supabase/client';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  cover_image_url: string | null;
  created_at: string;
}

type Tab = 'library' | 'progress';

interface ParentDashboardClientProps {
  householdId: string;
  kids: Kid[];
  books: Book[];
}

export const ParentDashboardClient = ({
  householdId,
  kids,
  books,
}: ParentDashboardClientProps) => {
  const router = useRouter();
  const [selectedKidId, setSelectedKidId] = useState<string | undefined>(kids[0]?.id);
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [showAddKid, setShowAddKid] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);

  const handleDeleteBook = async (bookId: string) => {
    const supabase = createClient();
    await supabase.from('books').update({ status: 'deleted' }).eq('id', bookId);
    router.refresh();
  };

  const handleAddKid = () => setShowAddKid(true);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'library', label: 'Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/h/${householdId}`)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">EmberTales</h1>
                <p className="text-sm text-muted-foreground">Parent Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Kid selector */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Select Child</h2>
          <KidSelector
          kids={kids}
          selectedKidId={selectedKidId}
          onSelectKid={setSelectedKidId}
          onAddKid={handleAddKid}
          onEditKid={(kid) => setEditingKid(kid)}
        />
        </section>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{books.filter((b) => b.status === 'ready').length}</p>
              <p className="text-sm text-muted-foreground">Books Read</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">&mdash;</p>
              <p className="text-sm text-muted-foreground">Reading Time</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{books.length}</p>
              <p className="text-sm text-muted-foreground">Total Books</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Upload zone at top of library */}
              <div className="max-w-2xl">
                <BookUpload householdId={householdId} />
              </div>

              {/* Book grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={{
                      id: book.id,
                      title: book.title,
                      author: book.author,
                      status: book.status,
                      coverImageUrl: book.cover_image_url,
                    }}
                    variant="parent"
                    onDelete={handleDeleteBook}
                  />
                ))}
                {books.length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground py-8">
                    No books yet. Drop a PDF above to get started.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center text-muted-foreground py-8"
            >
              {selectedKidId
                ? 'Reading progress will appear here once a kid starts reading.'
                : 'Select a kid to see their reading progress.'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AddKidDialog householdId={householdId} open={showAddKid} onClose={() => setShowAddKid(false)} />
      {editingKid && (
        <EditKidDialog
          kid={editingKid}
          open={!!editingKid}
          onClose={() => setEditingKid(null)}
        />
      )}
    </div>
  );
};
