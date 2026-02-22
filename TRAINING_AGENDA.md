# Pipecat Training Agenda: Building a Voice Bot from Scratch

This training curriculum is designed to take a beginner from zero to a fully functional voice-enabled AI bot using Pipecat, Daily, and Next.js. You will use an IDE with a coding assistant (like Cursor, Windsurf, or GitHub Copilot) to generate the code step-by-step.

## Goals
By the end of this training, you will understand:
1.  **The Architecture**: How a local Python bot connects to a web frontend via WebRTC.
2.  **The Pipeline**: How audio flows from mic → STT → LLM → TTS → speaker.
3.  **The Tools**: Next.js (frontend), FastAPI (signaling), Pipecat (voice orchestration).

## Prerequisites
- Node.js & npm/pnpm installed.
- Python 3.10+ & `uv` installed.
- API Keys for: Daily, OpenAI, Deepgram, Hume.

---

## Module 1: The "Hello World" Bot

### Purpose
Create a minimal Python bot that can join a Daily video call. This proves your environment is set up and you can establish a WebRTC connection.

### Agent Prompt
> Create a Python script `server/bot.py` that connects to a Daily room. 
> - Use `pipecat-ai[daily]` and `python-dotenv`.
> - Create a `DailyParams` transport.
> - The bot should join the room URL specified in `DAILY_SAMPLE_ROOM_URL`.
> - It should just sit there (no STT/TTS yet).
> - Use `asyncio` to run the main loop.

### References
- [Pipecat: Daily Transport](https://docs.pipecat.ai/server/transports/daily)
- [Daily: Room Creation](https://docs.daily.co/reference/rest-api/rooms/create-room)

### Verification
1.  Create a room manually in your Daily dashboard.
2.  Set `DAILY_SAMPLE_ROOM_URL` in `.env`.
3.  Run `uv run python server/bot.py`.
4.  Join the room in your browser. You should see a participant named "Bot" join.

---

## Module 2: The Frontend Connection

### Purpose
Build a web UI to join the call, replacing the manual dashboard room creation. We'll use the Next.js App Router and the Pipecat Voice UI Kit.

### Agent Prompt
> Scaffold a Next.js app in `client/`.
> - Use `pnpm`.
> - Install `@pipecat-ai/voice-ui-kit` and `@pipecat-ai/client-react`.
> - Create a generic `/api/start` route that proxies requests to our local bot.
> - Create a simple page with `<PipecatAppBase>` that connects to `/api/start`.
> - Add a "Connect" button that triggers the connection.

### References
- [Pipecat Voice UI Kit](https://docs.pipecat.ai/client/voice-ui-kit)
- [Next.js App Router](https://nextjs.org/docs/app)

### Verification
1.  Run the client: `pnpm dev`.
2.  Click "Connect".
3.  Ensure your browser asks for microphone permissions.
4.  (The connection will fail until we update the bot to listen for the start request, which is the next step).

---

## Module 3: The Pipeline & TTS (Making it Speak)

### Purpose
Now we give the bot a voice! We'll set up the core Pipecat `Pipeline` and add a Text-to-Speech (TTS) service.

### Agent Prompt
> Update `server/bot.py` to use a full Pipecat pipeline.
> - Add `HumeTTSService` with voice ID `f898a92e-685f-43fa-985b-a46920f0650b`.
> - Set `audio_out_sample_rate=44100` in PipelineParams (crucial for Hume).
> - Create a pipeline: `[transport.input(), tts, transport.output()]`.
> - When a client joins (`on_client_connected`), queue a `TTSStoppedFrame` or just a simple text frame to say "Hello world".

### References
- [Pipecat Pipelines](https://docs.pipecat.ai/server/pipeline)
- [Hume AI TTS](https://docs.hume.ai/docs/tts)

### Verification
1.  Run the bot.
2.  Connect with the client.
3.  You should hear "Hello world" (or whatever text you queued) spoken by the Hume voice.

---

## Module 4: The Brain (STT + LLM)

### Purpose
Turn the one-way speech into a conversation. We'll add Speech-to-Text (Ear) and a Large Language Model (Brain).

### Agent Prompt
> Add `DeepgramSTTService` and `OpenAILLMService` to the bot.
> - Use `gpt-4` for the LLM.
> - Create a `LLMContext` with a system prompt: "You are a helpful assistant."
> - Update the pipeline: `[transport.input(), stt, context_aggregator.user(), llm, tts, transport.output(), context_aggregator.assistant()]`.
> - Ensure `DeepgramSTTService` uses your API key.

### References
- [Deepgram STT](https://docs.pipecat.ai/server/services/deepgram)
- [OpenAI LLM](https://docs.pipecat.ai/server/services/openai)
- [Context Aggregators](https://docs.pipecat.ai/server/processors/aggregators)

### Verification
1.  Run the bot.
2.  Connect.
3.  Say "Hello, who are you?".
4.  The bot should transcribe your audio (check logs), send text to GPT-4, and speak the response.

---

## Module 5: Advanced Flow (Interruptions & RTVI)

### Purpose
Make the conversation feel real. Users should be able to interrupt the bot. We'll also add RTVI (Real-Time Voice Interface) support so the frontend knows the bot's state.

### Agent Prompt
> Enable interruptions and add RTVI.
> - Set `allow_interruptions=True` in `PipelineParams`.
> - Add `RTVIProcessor` to the pipeline (before STT).
> - Add `RTVIConfig` and `RTVIObserver`.
> - Handle `on_client_ready` event from RTVI to trigger the initial greeting.

### References
- [Handling Interruptions](https://docs.pipecat.ai/guides/interruptions)
- [RTVI Standard](https://github.com/rtvi-ai)

### Verification
1.  Run the bot.
2.  Connect.
3.  Ask the bot a long question or let it start a long answer.
4.  Interrupt it by speaking. The bot should stop talking immediately and listen to you.
