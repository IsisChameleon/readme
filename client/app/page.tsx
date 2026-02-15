'use client';

import { PipecatAppBase } from '@pipecat-ai/voice-ui-kit';
import { ClientApp } from './ClientApp';
import '@pipecat-ai/voice-ui-kit/styles.scoped';

export default function Home() {
  return (
    <div className="vkui-root">
      <div className="voice-ui-kit">
        <PipecatAppBase
          transportType="daily"
          connectParams={{
            endpoint: '/api/start',
          }}>
          {({ handleConnect, handleDisconnect }) => (
            <ClientApp
              connect={handleConnect}
              disconnect={handleDisconnect}
            />
          )}
        </PipecatAppBase>
      </div>
    </div>
  );
}
