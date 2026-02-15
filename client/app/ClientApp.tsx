"use client";

import {
    usePipecatClient,
} from "@pipecat-ai/client-react";
import {
    ConnectButton,
    Conversation,
    Panel,
    PanelContent,
    PanelHeader,
    PanelTitle,
    UserAudioControl,
    usePipecatConnectionState,
} from "@pipecat-ai/voice-ui-kit";
import React, { useEffect, useState } from "react";

interface Props {
    connect?: () => void | Promise<void>;
    disconnect?: () => void | Promise<void>;
}

export const ClientApp: React.FC<Props> = ({ connect, disconnect }) => {
    const client = usePipecatClient();
    const { isDisconnected } = usePipecatConnectionState();
    const [hasDisconnected, setHasDisconnected] = useState(false);

    useEffect(() => {
        if (hasDisconnected) return;
        if (client && isDisconnected) {
            client.initDevices();
        }
    }, [client, hasDisconnected, isDisconnected]);

    const handleConnect = async () => {
        try {
            connect?.();
        } catch (error) {
            console.error("Connection error:", error);
        }
    };

    const handleDisconnect = async () => {
        setHasDisconnected(true);
        disconnect?.();
    };

    if (!client) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Initializing...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gray-50 dark:bg-gray-900 p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Readme – Kid Reading App
            </h1>

            <ConnectButton onConnect={handleConnect} onDisconnect={handleDisconnect} />

            {!hasDisconnected && (
                <Panel className="w-full max-w-2xl h-[400px]">
                    <PanelHeader>
                        <PanelTitle>Conversation</PanelTitle>
                    </PanelHeader>
                    <PanelContent className="h-full p-0 min-h-0">
                        <Conversation assistantLabel="Agent" clientLabel="You" />
                    </PanelContent>
                </Panel>
            )}

            <UserAudioControl visualizerProps={{ barCount: 5 }} />
        </div>
    );
};
