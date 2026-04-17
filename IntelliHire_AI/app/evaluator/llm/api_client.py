import asyncio
import httpx
import json

from app.evaluator.config.settings import (
    HF_API_KEY,
    HF_API_URL,
    HF_MODEL,
    REQUEST_TIMEOUT,
    MAX_RETRIES,
)

from app.evaluator.llm.errors import (
    LLMError,
    LLMTimeoutError,
    LLMResponseError,
)


class HuggingFaceLLMClient:
    def __init__(self):
        if not HF_API_URL.rstrip("/").endswith("/v1"):
            raise ValueError(
                "HF_API_URL must end with /v1 when using routing-only client"
            )

        self.headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
            "Content-Type": "application/json",
        }

    async def generate(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 512,
        stop: list | None = None,
    ) -> str:

        payload = {
            "model": HF_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }

        if stop:
            payload["stop"] = stop

        last_error = None

        for attempt in range(MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                    response = await client.post(
                        f"{HF_API_URL}/chat/completions",
                        headers=self.headers,
                        json=payload,
                    )

                # Handle service unavailable with retry
                if response.status_code == 503:
                    last_error = LLMResponseError("Service unavailable")
                    await asyncio.sleep(1.5 * (attempt + 1))
                    continue

                # Handle other HTTP errors
                if response.status_code >= 400:
                    raise LLMResponseError(
                        f"HF routing error {response.status_code}: {response.text}"
                    )

                # Parse and validate response structure
                try:
                    data = response.json()
                except json.JSONDecodeError as e:
                    raise LLMResponseError(f"Invalid JSON response: {response.text}") from e

                # Validate response has expected structure
                try:
                    content = data["choices"][0]["message"]["content"].strip()
                    return content
                except (KeyError, IndexError, AttributeError) as e:
                    raise LLMResponseError(
                        f"Unexpected response structure: {data}"
                    ) from e

            except httpx.ReadTimeout as e:
                last_error = e
                await asyncio.sleep(1.5 * (attempt + 1))
                continue
            except (LLMResponseError, LLMTimeoutError) as e:
                last_error = e
                raise
            except Exception as e:
                raise LLMError(f"Unexpected error: {str(e)}") from e

        # All retries exhausted
        raise LLMTimeoutError(f"Failed after {MAX_RETRIES + 1} attempts: {str(last_error)}")