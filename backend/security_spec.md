# Security Specification for LAWGIC AI Firestore Database

## 1. Data Invariants
1. **User Profiles (`/users/{userId}`)**:
   - Only the authenticated user matching `userId` or an Admin can create/update their profile.
   - User profile must contain valid fields (`userId`, `email`, `displayName`, `role`, `station`).
   - Role updates are restricted to ensure privilege escalation is impossible.
2. **FIR Cases (`/cases/{caseId}`)**:
   - `caseId` must match standard alphanumeric and hyphen patterns.
   - `userId` must match `request.auth.uid` upon creation.
   - Updates must preserve immutable fields (`userId`, `caseId`, `createdAt`).
   - Any authenticated officer in the department can view registered cases; drafts are viewable by owner or admin.
   - State transition: once marked `Closed`, only admins can modify case outcome.
3. **Audit Trail (`/audit_logs/{logId}`)**:
   - Immutable append-only log.
   - Cannot be modified or deleted by any non-admin.
   - Must contain authenticated `userId` matching `request.auth.uid`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Payload 1 (Ghost Field in User Profile)**: Attempt to set `isAdmin: true` directly on `/users/{userId}` write.
2. **Payload 2 (Unauthenticated Case Creation)**: Attempt to create `/cases/{caseId}` with `request.auth == null`.
3. **Payload 3 (Spoofed Author Case Creation)**: User `A` creates case with `userId: "User_B"`.
4. **Payload 4 (Oversized Narrative Injection)**: Attempt to write a 2MB string into `incidentDescription`.
5. **Payload 5 (Audit Log Tampering)**: Attempt to update an existing audit log entry `/audit_logs/{logId}`.
6. **Payload 6 (Audit Log Deletion)**: Regular user attempts to delete `/audit_logs/{logId}`.
7. **Payload 7 (Immutable Field Mutation)**: User attempts to modify `createdAt` or `caseId` on existing case.
8. **Payload 8 (Invalid Priority Enum)**: Case creation with `priority: "SuperUrgent"`.
9. **Payload 9 (ID Injection Attack)**: Document write to `/cases/{caseId}` with a 500-character malicious path ID.
10. **Payload 10 (Closed Case Mutation by Officer)**: Non-admin officer attempts to modify a `Closed` case.
11. **Payload 11 (Blanket Read Bypass)**: Attempting unauthenticated listing of confidential pending drafts.
12. **Payload 12 (Direct Role Escalation)**: User modifies their own `role` from `Constable` to `Admin`.
