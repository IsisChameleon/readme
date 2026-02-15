# Readme Server

Backend services for the Book Reader App, including the FastAPI API and the Pipecat AI voice bot.

## Local Development Testing

When running the bot locally, Pipecat provides a built-in development interface to test your voice pipeline without needing to launch the full application frontend.

### 1. Start the Bot
Run the following command from the `server` directory:
```bash
uv run python -m pipecat.runner.run
```
This command uses the Pipecat "Runner" module to orchestrate the bot process.

### 2. Access the Built-in Client
Once the bot is running, open your browser to:
**[http://localhost:7860/client](http://localhost:7860/client)**

### Features
This interface is a pre-configured WebRTC client (powered by Pipecat's internal tooling, similar to `pipecat-smallwebrtc`) that allows you to:
- **Audio Test**: Verify your microphone and speaker settings.
- **Microphone Toggle**: Connect your voice to the bot.
- **Transcripts**: See real-time speech-to-text (STT) and LLM response text.
- **Pipeline Monitoring**: Observe the status of the Pipecat pipeline as it processes frames.

> [!TIP]
> Use this client for fast iteration on the bot's personality, prompts, and tool-calling logic before testing the full end-to-end integration with the Next.js frontend.

## Deployment
This server is configured for deployment on Pipecat Cloud using the settings in `pcc-deploy.toml`.
