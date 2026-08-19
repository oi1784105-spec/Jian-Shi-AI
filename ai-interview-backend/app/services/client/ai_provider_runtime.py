import asyncio
import ipaddress
import logging
import os
import socket
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx
import litellm
from app.core.config import settings

from app.exceptions.http_exceptions import ValidationError

os.environ.setdefault("LITELLM_TELEMETRY", "False")
litellm.suppress_debug_info = True
litellm.set_verbose = False

logger = logging.getLogger(__name__)
litellm.telemetry = settings.LITELLM_TELEMETRY


PROVIDER_PRESETS = {
    "openai": {
        "label": "OpenAI", "protocol": "openai_compatible", "model_prefix": "openai",
        "base_url": "https://api.openai.com/v1", "website_url": "https://platform.openai.com",
        "models": ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"], "discovery": "openai",
    },
    "deepseek": {
        "label": "DeepSeek", "protocol": "openai_compatible", "model_prefix": "deepseek",
        "base_url": "https://api.deepseek.com", "website_url": "https://platform.deepseek.com",
        "models": ["deepseek-chat", "deepseek-reasoner"], "discovery": "openai",
    },
    "anthropic": {
        "label": "Anthropic Claude", "protocol": "anthropic_messages", "model_prefix": "anthropic",
        "base_url": "https://api.anthropic.com/v1", "website_url": "https://console.anthropic.com",
        "models": ["claude-3-5-haiku-latest", "claude-sonnet-4-20250514"], "discovery": "anthropic",
    },
    "gemini": {
        "label": "Google Gemini", "protocol": "gemini_generate_content", "model_prefix": "gemini",
        "base_url": "https://generativelanguage.googleapis.com/v1beta", "website_url": "https://aistudio.google.com",
        "models": ["gemini-2.0-flash", "gemini-2.5-flash"], "discovery": "gemini",
    },
    "qwen": {
        "label": "Qwen", "protocol": "openai_compatible", "model_prefix": "openai",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1", "website_url": "https://bailian.console.aliyun.com",
        "models": ["qwen-plus", "qwen-turbo", "qwen-max"], "discovery": "openai",
    },
    "kimi": {
        "label": "Kimi", "protocol": "openai_compatible", "model_prefix": "openai",
        "base_url": "https://api.moonshot.cn/v1", "website_url": "https://platform.moonshot.cn",
        "models": ["moonshot-v1-8k", "moonshot-v1-32k", "kimi-k2-0711-preview"], "discovery": "openai",
    },
    "glm": {
        "label": "GLM", "protocol": "openai_compatible", "model_prefix": "openai",
        "base_url": "https://open.bigmodel.cn/api/paas/v4", "website_url": "https://open.bigmodel.cn",
        "models": ["glm-4-flash", "glm-4-plus"], "discovery": "openai",
    },
    "groq": {
        "label": "Groq", "protocol": "openai_compatible", "model_prefix": "groq",
        "base_url": "https://api.groq.com/openai/v1", "website_url": "https://console.groq.com",
        "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"], "discovery": "openai",
    },
    "openrouter": {
        "label": "OpenRouter", "protocol": "openai_compatible", "model_prefix": "openrouter",
        "base_url": "https://openrouter.ai/api/v1", "website_url": "https://openrouter.ai",
        "models": ["openai/gpt-4o-mini", "anthropic/claude-3.5-haiku"], "discovery": "openai",
    },
    "azure": {
        "label": "Azure OpenAI", "protocol": "azure_openai", "model_prefix": "azure",
        "base_url": "", "website_url": "https://azure.microsoft.com/products/ai-services/openai-service",
        "models": [], "discovery": None,
    },
    "custom": {
        "label": "Custom OpenAI Compatible", "protocol": "openai_compatible", "model_prefix": "openai",
        "base_url": "", "website_url": "", "models": [], "discovery": "openai",
    },
}


def get_preset(provider: str) -> dict:
    preset = PROVIDER_PRESETS.get(provider)
    if not preset:
        raise ValidationError(message="不支持的 API 供应商")
    return preset


def normalize_base_url(provider: str, base_url: str | None) -> str:
    preset = get_preset(provider)
    value = (base_url or preset["base_url"]).strip().rstrip("/")
    if not value:
        raise ValidationError(message="该供应商需要填写 API Endpoint")
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValidationError(message="API Endpoint 必须是公开的 HTTPS 地址")
    if parsed.query or parsed.fragment:
        raise ValidationError(message="API Endpoint 不能包含查询参数或片段")
    return value


def normalize_models(models: list[str], default_model: str) -> list[str]:
    values = []
    for model in [*models, default_model]:
        value = model.strip()
        if value and value not in values:
            if len(value) > 200:
                raise ValidationError(message="模型名称不能超过 200 个字符")
            values.append(value)
    return values


def is_official_provider_endpoint(provider: str | None, base_url: str) -> bool:
    """Return whether the endpoint uses a built-in provider's official host.

    Some desktop proxy clients resolve public domains to RFC 2544 Fake-IP
    addresses (198.18.0.0/15). Those addresses are intentionally non-global,
    so DNS-based SSRF checks cannot distinguish them from a private target.
    Built-in provider URLs are application-controlled and can be trusted
    without weakening validation for custom endpoints.
    """
    if not provider:
        return False
    official_url = get_preset(provider)["base_url"].strip()
    if not official_url:
        return False
    endpoint = urlparse(base_url)
    official = urlparse(official_url)
    return (
        endpoint.scheme == "https"
        and endpoint.hostname == official.hostname
        and (endpoint.port or 443) == (official.port or 443)
    )


async def assert_public_endpoint(base_url: str, provider: str | None = None) -> None:
    if is_official_provider_endpoint(provider, base_url):
        return

    parsed = urlparse(base_url)
    host = parsed.hostname
    if not host:
        raise ValidationError(message="API Endpoint 无效")

    try:
        literal = ipaddress.ip_address(host)
        if not literal.is_global:
            raise ValidationError(message="API Endpoint 不能指向本机或内网地址")
        return
    except ValueError:
        pass

    try:
        records = await asyncio.to_thread(socket.getaddrinfo, host, parsed.port or 443, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValidationError(message="API Endpoint 域名无法解析") from exc

    addresses = {record[4][0] for record in records}
    if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
        raise ValidationError(message="API Endpoint 不能指向本机或内网地址")


@dataclass(frozen=True)
class ProviderRuntimeConfig:
    provider: str
    base_url: str
    api_key: str
    model: str
    api_version: str | None = None


class AIProviderRuntime:
    def __init__(self, config: ProviderRuntimeConfig):
        self.config = config
        self.preset = get_preset(config.provider)

    def _model_name(self) -> str:
        prefix = self.preset["model_prefix"]
        expected = f"{prefix}/"
        return self.config.model if self.config.model.startswith(expected) else f"{expected}{self.config.model}"

    def _completion_args(self, messages: list, temperature: float, max_tokens: int, stream: bool = False) -> dict:
        args = {
            "model": self._model_name(),
            "messages": messages,
            "api_key": self.config.api_key,
            "api_base": self.config.base_url,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
            "timeout": 60,
        }
        if self.config.api_version:
            args["api_version"] = self.config.api_version
        return args

    async def chat(self, messages: list, temperature: float = 0.7, max_tokens: int = 2000) -> str:
        await assert_public_endpoint(self.config.base_url, self.config.provider)
        response = await litellm.acompletion(**self._completion_args(messages, temperature, max_tokens))
        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("Provider returned an empty response")
        return content.strip()

    async def chat_stream(self, messages: list, temperature: float = 0.7, max_tokens: int = 2000):
        await assert_public_endpoint(self.config.base_url, self.config.provider)
        stream = await litellm.acompletion(**self._completion_args(messages, temperature, max_tokens, stream=True))
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    async def test_connection(self) -> None:
        await assert_public_endpoint(self.config.base_url, self.config.provider)
        response = await litellm.acompletion(
            **self._completion_args(
                [{"role": "user", "content": "Reply with OK."}],
                temperature=0,
                max_tokens=3,
            )
        )
        if not response.choices:
            raise RuntimeError("Provider returned no choices")


def safe_provider_error(exc: Exception) -> str:
    name = type(exc).__name__.lower()
    status = getattr(exc, "status_code", None)
    if status is None and getattr(exc, "response", None) is not None:
        status = getattr(exc.response, "status_code", None)
    if status in (401, 403) or "auth" in name or "permission" in name:
        return "API Key 无效或没有访问权限"
    if status == 404 or "notfound" in name:
        return "API Endpoint 或模型不存在"
    if status == 429 or "ratelimit" in name:
        return "供应商限流或账户余额不足"
    if "timeout" in name:
        return "连接供应商超时"
    if isinstance(exc, (httpx.ConnectError, socket.gaierror)):
        return "无法连接到供应商 API"
    return "供应商连接测试失败，请检查 Endpoint、API Key 和模型"


async def discover_models(provider: str, base_url: str | None, api_key: str, api_version: str | None = None) -> list[str]:
    preset = get_preset(provider)
    url = normalize_base_url(provider, base_url)
    await assert_public_endpoint(url, provider)
    if not api_key.strip():
        raise ValidationError(message="请填写 API Key")
    if provider == "azure" or not preset["discovery"]:
        return preset["models"]

    headers = {"Accept": "application/json"}
    endpoint = f"{url}/models"
    if preset["discovery"] == "anthropic":
        headers.update({"x-api-key": api_key.strip(), "anthropic-version": api_version or "2023-06-01"})
    elif preset["discovery"] == "gemini":
        headers["x-goog-api-key"] = api_key.strip()
    else:
        headers["Authorization"] = f"Bearer {api_key.strip()}"

    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=False, trust_env=False) as client:
            response = await client.get(endpoint, headers=headers)
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        logger.warning("Provider model discovery failed provider=%s error_type=%s", provider, type(exc).__name__)
        raise ValidationError(message=safe_provider_error(exc)) from None

    items = payload.get("data") or payload.get("models") or []
    models = []
    for item in items:
        if not isinstance(item, dict):
            continue
        if provider == "gemini" and "generateContent" not in item.get("supportedGenerationMethods", []):
            continue
        model = item.get("id") or item.get("name")
        if isinstance(model, str):
            model = model.removeprefix("models/")
            if model and model not in models:
                models.append(model)
    # Keep discovery output compatible with AIProviderCreate.models.
    return sorted(models)[:50]
