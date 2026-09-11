# ASAPP · implementation plan

1. npm workspaces, Next.js App Router, reusable UI tokens.
2. PostgreSQL schema, repository adapter, transactional domain services.
3. Supabase email OTP and explicit development-only demo sessions.
4. Reproducible fixtures: 20 users, 2 organizations, 3 collections, 10 drops, 40 claims.
5. Consumer landing, collection filters, details, public profiles and exploration.
6. QR and hashed secret claims with database-backed throttling and atomic capacity enforcement.
7. Studio organization, drop creation/editing, artwork upload, QR, collectors, collections and analytics.
8. Domain/integration tests, responsive flow verification, production build and deployment instructions.

Production dependencies: a Supabase project, its database connection, Auth email delivery and an upload bucket. Local PGlite runs the same PostgreSQL migration and domain layer; demo identity is explicitly isolated from production.
