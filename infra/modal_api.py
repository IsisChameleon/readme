from __future__ import annotations

import modal

from infra.common import api_image, app, bootstrap_repo, config, secrets


@app.function(
    image=api_image,
    secrets=secrets,
    region=[config.region],
    timeout=10 * 60,
)
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def serve_api():
    bootstrap_repo()
    from server.api.main import app as fastapi_app

    return fastapi_app
