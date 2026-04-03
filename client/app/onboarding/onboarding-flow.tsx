'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { apiClient, getAccessToken } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';
import { BookUploadOnboarding } from './book-upload-onboarding';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const COLOR_OPTIONS = [
  '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C',
];

interface OnboardingFlowProps {
  householdId: string;
}

export const OnboardingFlow = ({ householdId }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [kidName, setKidName] = useState('');
  const [kidColor, setKidColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kidCreated, setKidCreated] = useState(false);
  const [bookUploaded, setBookUploaded] = useState(false);
  const router = useRouter();

  const handleCreateKid = async () => {
    if (!kidName.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      const { error } = await apiClient.POST('/kids', {
        params: { header: { authorization: `Bearer ${token}` } },
        body: {
          household_id: householdId,
          name: kidName.trim(),
          avatar: kidName.trim()[0].toUpperCase(),
          color: kidColor,
        },
      });
      if (error) throw new Error('Failed to create kid');

      setKidCreated(true);
      toast({ title: `Welcome, ${kidName.trim()}!` });
      setStep(2);
    } catch {
      toast({ title: 'Failed to create profile', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    // Mark onboarding as completed
    const supabase = createClient();
    await supabase
      .from('households')
      .update({ onboarding_completed: true })
      .eq('id', householdId);

    router.push(`/h/${householdId}`);
    router.refresh();
  };

  const handleSkipBook = () => {
    handleComplete();
  };

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-muted h-1">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: step === 1 ? '50%' : '100%' }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                    Welcome to EmberTales!
                  </h1>
                  <p className="text-muted-foreground">
                    Add a reader
                  </p>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={kidName}
                      onChange={(e) => setKidName(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter their name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Choose a Color
                    </label>
                    <div className="flex gap-3">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setKidColor(c)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            kidColor === c
                              ? 'border-foreground scale-110'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {kidName.trim() && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted">
                      <span
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                        style={{ backgroundColor: kidColor }}
                      >
                        {kidName.trim()[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-lg">{kidName.trim()}</p>
                        <p className="text-sm text-muted-foreground">
                          Ready to read
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCreateKid}
                    disabled={!kidName.trim() || isSubmitting}
                    className="w-full h-12 text-base font-semibold gap-2"
                  >
                    {isSubmitting ? (
                      'Creating...'
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                    Add Your First Book
                  </h1>
                  <p className="text-muted-foreground">
                    Upload a PDF for {kidName}
                  </p>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
                  <BookUploadOnboarding
                    householdId={householdId}
                    onUploadComplete={() => setBookUploaded(true)}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-12 px-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    
                    {bookUploaded ? (
                      <Button
                        onClick={handleComplete}
                        className="flex-1 h-12 text-base font-semibold gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Start Reading
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={handleSkipBook}
                        className="flex-1 h-12 text-base text-muted-foreground"
                      >
                        Skip for now
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
