# Security Specification — Cadence Scheduling

## 1. Data Invariants
1. Every document under `/users/{userId}` belongs strictly to the verified authenticated Google account where `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. PII (`email`) is isolated in `/users/{userId}/private/info` and never exposed to non-owners.
3. All `ownerId` and `createdAt` fields are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
4. Bookings cannot be modified once they reach the terminal `cancelled` status.
5. Every `create` payload must satisfy strict `hasAll` and `hasOnly` key checks, bounded string `.size()`, and valid ID regexes (`^[a-zA-Z0-9_\-]+$`).
6. Every `list` rule enforces `resource.data.ownerId == request.auth.uid` without `get()` or `exists()`.

## 2. Adversarial Payloads ("Dirty Dozen")
1. **Unauthenticated read on bookings**: `get /users/u1/bookings/bk-101` with `auth = null` -> `PERMISSION_DENIED`.
2. **Cross-user read on PII**: `get /users/u1/private/info` as `u2` -> `PERMISSION_DENIED`.
3. **Unverified email spoof**: `create /users/u1/bookings/bk-1` as `u1` with `email_verified = false` -> `PERMISSION_DENIED`.
4. **OwnerId spoofing**: `create /users/u1/bookings/bk-1` as `u1` with `ownerId: "u2"` -> `PERMISSION_DENIED`.
5. **Shadow field injection**: `create /users/u1/bookings/bk-1` with extra `isAdmin: true` -> `PERMISSION_DENIED`.
6. **ID poisoning**: `create /users/u1/bookings/bad$id/..` or >128 char ID -> `PERMISSION_DENIED`.
7. **Forged timestamp on create**: `create /users/u1/bookings/bk-1` with client `createdAt` != `request.time` -> `PERMISSION_DENIED`.
8. **Immutable ownerId mutation**: `update /users/u1/bookings/bk-101` changing `ownerId` -> `PERMISSION_DENIED`.
9. **Terminal state bypass**: `update /users/u1/bookings/bk-104` (already `cancelled`) changing `status` to `confirmed` -> `PERMISSION_DENIED`.
10. **Payload exhaustion (oversized notes)**: `create /users/u1/bookings/bk-2` with 5000-char `notes` -> `PERMISSION_DENIED`.
11. **Invalid enum injection**: `create /users/u1/bookings/bk-2` with `status: "completed"` -> `PERMISSION_DENIED`.
12. **Blanket list scraping**: `list /users/u1/bookings` without matching `ownerId == request.auth.uid` or as `u2` -> `PERMISSION_DENIED`.
