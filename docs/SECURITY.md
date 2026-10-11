# TaxShield Enterprise — Security Notes

**Scope: what this document is.** This is an honest description of the security
design of a student demonstration project. It is not a penetration test
report, not a compliance certification, and not a promise of production
readiness.

## What is protected

| Layer | Mechanism | Notes |
|---|---|---|
| Event payloads at rest | AES-256-GCM (authenticated encryption) | 12-byte random nonce per record; ciphertext + nonce stored together |
| Ledger integrity | SHA-256 hash chain | Each row hashes (prev_hash + ciphertext); any edit or reorder breaks verification and names the first bad row |
| API access | JWT (HS256, 8h expiry) via `Authorization: Bearer` | Login rate-limited to 10/min; all data routes return 401 without a valid token |
| Login credential check | `hmac.compare_digest` | Constant-time comparison for demo user/password |
| Transport-level input | Pydantic validation on every event | Invalid shapes rejected with 422 before reaching storage |
| Abuse control | slowapi rate limits per route | Events 120/min, connector pulls 10/min, login 10/min |
| Browser access | CORS allowlist | Only `DASHBOARD_ORIGIN` (default http://localhost:3000) |
| Upload size | 5 MB cap on CSV upload | Prevents trivial memory exhaustion |

## Key handling

- The AES key (`TAXSHIELD_KEY`) and JWT secret (`JWT_SECRET`) are read **only**
  from environment variables (`python-dotenv` loads `.env`, which is
  gitignored). Neither value is ever committed.
- `.env.example` ships placeholder strings only.
- **No key rotation, no HSM, no AWS KMS integration.** One symmetric key
  protects every record; anyone who obtains it can forge the entire chain
  (see limitations).

## What is NOT protected (stated plainly)

1. **Single symmetric key.** The same AES-256-GCM key encrypts all events and
   never rotates. In production you would use per-record data keys wrapped by
   an KMS-managed master key.
2. **The hash chain proves tampering, it does not prevent it.** An attacker
   with database write access AND the encryption key can rewrite a row and
   re-hash every subsequent row. The chain raises the cost of casual or
   partial tampering; it is not a blockchain and has no external anchoring.
3. **No AWS Nitro Enclaves.** Roadmap only. Enclave attestation is not
   implemented.
4. **No mTLS / private PKI.** The API is plain HTTP on localhost.
5. **JWT secret is HS256 symmetric.** Anyone with the secret can mint tokens.
   Production would use asymmetric keys or a managed identity provider.
6. **No account system.** One shared demo user; no MFA, no password policy, no
   lockout beyond the rate limit.
7. **Rate limiting is in-process.** Restarting the API resets counters; a
   multi-process deployment would need a shared store.
8. **Dependency audit is automated, not exhaustive.** `pip-audit` and
   `npm audit` results are recorded in the README; findings are not a
   substitute for professional review.

## What we actually tested (no overclaiming)

- **Unit tests (pytest, 21 passing):** encrypt/decrypt round trip, unique
  nonces, wrong-key decryption failure, ciphertext tamper failure, hash-chain
  detection of payload tamper and row reorder, JWT acceptance/rejection
  (missing, forged, expired), event schema validation (5 bad shapes), nexus
  threshold math, CSV parser error paths, insurance threshold logic.
- **Tamper demo (`python -m security.tamper_demo`):** modifies one stored row
  directly in SQLite, then verification reports `valid: false` and
  `first_broken_seq` pointing at the exact record. This was executed against
  the live database, not mocked.
- **Dependency scan:** `pip-audit -r requirements.txt` and `npm audit` —
  results in the README.
- **Not tested:** no professional penetration test, no fuzzing campaign, no
  formal threat model review, no review of the crypto protocol by a
  cryptographer.

## Reporting

This is coursework, not a deployed service. If you find a real issue, open a
GitHub issue without exploiting it against anyone's data.
