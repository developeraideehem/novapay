# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (master) | ✅ |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in NovaPay, please report it responsibly:

1. **Email**: Send details to `damilola.odubanjo@protonmail.com`
2. **Subject**: `[SECURITY] NovaPay — <brief description>`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within **48 hours** and aim to release a fix within **7 days** for critical issues.

## Security Best Practices for Contributors

- **Never commit secrets** — all API keys must go in `.env` (which is in `.gitignore`)
- **Use `.env.example`** to document required variables without values
- **RLS is mandatory** — every new Supabase table must have Row-Level Security enabled
- **Validate on the server** — never trust client-side only checks for financial amounts
- **PIN hashing** — transaction PINs are always hashed server-side; never store plaintext

## Known Security Measures

- ✅ Row-Level Security on all Supabase tables
- ✅ Supabase functions use `SECURITY DEFINER` for privileged operations
- ✅ Environment variables for all secrets (never hardcoded)
- ✅ HTTPS-only communication with all external APIs
- ✅ Secure storage for mobile (Expo SecureStore)
- ✅ Security headers via Vercel (X-Frame-Options, CSP, etc.)
