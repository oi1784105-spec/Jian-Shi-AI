---
date: 2026-08-19
topic: user-api-provider-config
---

# User API Provider Configuration

## What We're Building

JianShi AI will require each signed-in user to configure a personal AI provider before using AI-powered resume parsing or interview workflows. Users can save multiple provider profiles, test them, retrieve or manually enter models, and activate one profile for new AI work.

The initial provider set is OpenAI, DeepSeek, Anthropic Claude, Google Gemini, Qwen, Kimi, GLM, Groq, OpenRouter, Azure OpenAI, and custom OpenAI-compatible endpoints. The existing light/dark themes and Chinese/English localization apply to the new configuration page.

## Why This Approach

A shared `.env` file cannot provide per-user isolation: it is process-global, concurrent updates overwrite each other, and containers do not safely reload it at runtime. User credentials will instead be encrypted per user in PostgreSQL. The server `.env` stores only the master encryption key.

LiteLLM provides a maintained compatibility layer for native and OpenAI-compatible completion APIs while preserving the project's existing chat-completion and streaming behavior. Provider-specific model discovery remains explicit because not every provider exposes a model-list endpoint.

## Key Decisions

### Credential Isolation

- API keys are encrypted with Fernet before database persistence.
- The Fernet master key is loaded from `API_KEY_ENCRYPTION_KEY` in the server `.env`.
- API responses expose only a short key hint. Create and update responses never include plaintext or ciphertext.
- Provider queries always include the authenticated `user_id`; one user cannot reference, activate, test, update, or delete another user's profile.
- The backoffice API does not expose provider configuration records.
- Sensitive values are excluded from application logs and sanitized from upstream error messages.

### Provider Profiles

Each profile stores a provider preset, stable user-owned identifier, display name, note, website URL, protocol, endpoint, encrypted API key, masked hint, model list, default model, optional API version, validation status, and active status.

Users may save multiple profiles but exactly one profile can be active at a time. Activating a profile is transactional. Updating its key or connection fields resets validation until the profile passes a new connection test.

### Provider Compatibility

- LiteLLM handles completion and streaming normalization.
- Known presets supply safe default endpoints, protocols, and models.
- OpenAI-compatible providers use standard Bearer authentication and `/models` discovery when supported.
- Anthropic and Gemini use their native model-list endpoints.
- Azure OpenAI and providers without model discovery support manual model entry.
- A manual model field is always available so an incomplete provider model-list API does not block configuration.

### Endpoint Security

- User-supplied endpoints must use public HTTPS URLs.
- Loopback, private, link-local, multicast, and metadata-network targets are rejected after DNS resolution.
- Redirects are not followed during model discovery.
- Local HTTP endpoints such as Ollama are intentionally excluded from this version.

### Connection Validation

Saving a profile validates its structure but does not silently spend provider credits. The explicit Test Connection action performs a minimal completion call using the chosen default model. Only successfully tested profiles can be activated and used.

Model discovery and connection tests use bounded timeouts. Provider errors are mapped to safe categories such as authentication failure, unavailable model, rate limit, timeout, and unreachable endpoint.

### AI Workflow Enforcement

- Dashboard and profile pages remain accessible without an API provider.
- Resume upload/analysis and interview creation require a validated active profile.
- Existing interviews store their provider profile ID and model at creation, keeping the provider stable for the entire interview and final report.
- Deleting a provider used by an in-progress interview is rejected. Key rotation remains available through profile editing.
- The server-level DeepSeek key is not used as a fallback for user workflows.

### Frontend Experience

The new `/settings/api` page follows JianShi AI's liquid-glass design tokens and includes:

- provider preset and identifier;
- display name, note, and website;
- protocol and API endpoint;
- masked API key input with reveal control for newly typed values;
- model discovery, manual model entry, and default model selection;
- connection test, activation, editing, and deletion;
- empty, loading, validation, success, and provider-error states;
- responsive desktop/mobile layouts, light/dark themes, and Chinese/English text.

Navigation includes an API configuration entry and an unobtrusive configuration-status indicator. AI entry points redirect to the configuration page when no validated active profile exists.

## Threat Model

- A database-only leak does not reveal provider keys without the server master key.
- A compromised server process or host administrator remains inside the trust boundary and can access decrypted keys while making authorized upstream requests.
- Public deployment requires HTTPS between browser and server. The current local Vite-to-VM connection is suitable only for local development.
- User-controlled URLs are treated as untrusted input and cannot target internal services.
- The provider necessarily receives resume and interview prompt content when the user invokes AI features.

## Not Doing

- Storing user keys in a shared `.env` file.
- Returning plaintext keys after submission.
- Allowing local/private HTTP model endpoints.
- Provider billing, quotas, usage analytics, or cost estimation.
- Automatic cross-provider model substitution when a selected model fails.
- Exposing user provider settings to administrators.

## Assumptions And Validation

- LiteLLM supports the required completion and streaming shapes; production build and mocked provider tests will validate both paths.
- Known providers' model endpoints can change; model discovery has manual-entry fallback and provider-specific tests.
- Existing AI prompts remain provider-neutral; resume parsing, question generation, evaluation streaming, and report generation will be regression-tested through the adapter.
- PostgreSQL migrations run before the new API is used; Alembic upgrade and downgrade paths will be checked.

## Open Questions

None. The user approved encrypted per-user storage, public HTTPS endpoints, multiple providers, and no local Ollama support on 2026-08-19.

## Next Steps

1. Add the encryption configuration, provider model, and Alembic migration.
2. Implement provider CRUD, model discovery, connection testing, activation, and status APIs.
3. Replace the process-global DeepSeek client with a per-user LiteLLM runtime.
4. Enforce provider requirements in resume and interview workflows.
5. Build the localized responsive configuration page and navigation state.
6. Run backend unit/API tests, both frontend production builds, and browser visual checks.

<details>
<summary>Decision record</summary>

- The original request proposed storing each user's key in `.env`.
- The design review identified that a shared `.env` contradicts per-user isolation.
- The user explicitly approved the recommended encrypted-database design and public HTTPS endpoint restriction.

</details>
