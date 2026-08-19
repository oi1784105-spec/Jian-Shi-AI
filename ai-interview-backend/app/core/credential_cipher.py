from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


class CredentialCipher:
    """Encrypts user credentials with the server-side master key."""

    @staticmethod
    def _fernet() -> Fernet:
        key = settings.API_KEY_ENCRYPTION_KEY.strip()
        if not key:
            raise RuntimeError("API_KEY_ENCRYPTION_KEY is not configured")
        try:
            return Fernet(key.encode("utf-8"))
        except (TypeError, ValueError) as exc:
            raise RuntimeError("API_KEY_ENCRYPTION_KEY is invalid") from exc

    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        value = plaintext.strip()
        if not value:
            raise ValueError("API Key cannot be empty")
        return cls._fernet().encrypt(value.encode("utf-8")).decode("utf-8")

    @classmethod
    def decrypt(cls, ciphertext: str) -> str:
        try:
            return cls._fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
        except InvalidToken as exc:
            raise RuntimeError("Stored API Key cannot be decrypted") from exc

    @staticmethod
    def key_hint(api_key: str) -> str:
        value = api_key.strip()
        return value[-4:] if len(value) >= 4 else value
