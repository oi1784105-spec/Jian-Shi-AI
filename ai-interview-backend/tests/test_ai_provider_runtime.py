import asyncio
import socket

import pytest

from app.exceptions.http_exceptions import ValidationError
from app.services.client.ai_provider_runtime import assert_public_endpoint, safe_provider_error


def fake_ip_dns(*_args, **_kwargs):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("198.18.0.186", 443))]


def test_official_provider_endpoint_allows_proxy_fake_ip(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", fake_ip_dns)

    asyncio.run(assert_public_endpoint("https://api.deepseek.com", "deepseek"))
    asyncio.run(assert_public_endpoint("https://api.deepseek.com/v1", "deepseek"))


def test_custom_endpoint_still_rejects_proxy_fake_ip(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", fake_ip_dns)

    with pytest.raises(ValidationError, match="不能指向本机或内网地址"):
        asyncio.run(assert_public_endpoint("https://custom.example/v1", "custom"))


def test_modified_provider_endpoint_still_uses_dns_validation(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", fake_ip_dns)

    with pytest.raises(ValidationError, match="不能指向本机或内网地址"):
        asyncio.run(assert_public_endpoint("https://proxy.example/v1", "deepseek"))


def test_httpx_response_status_is_used_for_safe_error():
    class Response:
        status_code = 401

    class ProviderError(Exception):
        response = Response()

    assert safe_provider_error(ProviderError()) == "API Key 无效或没有访问权限"
