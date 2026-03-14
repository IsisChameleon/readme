'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { VoiceSession } from '@/components/VoiceSession';
import '@pipecat-ai/voice-ui-kit/styles.scoped';

export default function CallPage() {
  return (
    <motion.div
      className="fixed inset-0"
      style={{ background: '#150f20' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="vkui-root dark" style={{ width: '100%', height: '100%' }}>
        <div className="voice-ui-kit" style={{ width: '100%', height: '100%' }}>
          <Suspense>
            <VoiceSession />
          </Suspense>
        </div>
      </div>
    </motion.div>
  );
}
