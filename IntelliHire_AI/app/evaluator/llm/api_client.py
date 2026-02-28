import asyncio
import httpx

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

                if response.status_code == 503:
                    await asyncio.sleep(1.5 * (attempt + 1))
                    continue

                if response.status_code >= 400:
                    raise LLMResponseError(
                        f"HF routing error {response.status_code}: {response.text}"
                    )

                data = response.json()
                return data["choices"][0]["message"]["content"].strip()

            except httpx.ReadTimeout as e:
                last_error = e
                await asyncio.sleep(1.5 * (attempt + 1))

            except Exception as e:
                raise LLMError(str(e))

        raise LLMTimeoutError(str(last_error))
