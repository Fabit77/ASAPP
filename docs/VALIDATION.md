# Validation record

Validated locally on 2026-09-11 with Node 24.19 and Next.js 16.3.4.

## Automated

- TypeScript strict typecheck passes.
- ESLint passes without warnings.
- 17 integration/domain tests pass against isolated PGlite PostgreSQL with the production migration.
- Production build passes with Webpack. Turbopack could not open an internal worker port in this execution environment; project scripts explicitly use Webpack.
- npm audit reports zero known vulnerabilities at validation time.

## Browser and HTTP

- New development account starts with an empty collection.
- Secret word claim shows “Ya es tuyo” and persists the collectible in the personal grid.
- Created a new organization and thematic collection using Studio forms.
- Created and published an asado with a collection and supply 17; Studio displays the generated QR and 0/17 capacity.
- Opened its generated claim URL, collected the asado, and verified that the organization collector table contains the participant and count.
- Responsive document widths match the requested 375, 768 and 1440 pixel viewports; consumer mobile collection and desktop exploration visually inspected.
- Uploaded a generated square PNG fixture through the authenticated API; server successfully recoded it and returned the artwork route.

The database and artifacts produced by manual checks exist only in ignored `.data/`; they are not included in the seed or Git repository.

## Vercel

- Production deployment completed at `https://asapp-orpin.vercel.app`.
- The production home and Explore routes return HTTP 200.
- The published landing page was inspected in a browser and shows the hosted-demo banner.

## External integration remaining

No Supabase project credentials were supplied. Real email delivery, the Supabase Storage bucket, a hosted postgres.js connection, and physical second-device scanning have not been exercised. The hosted demo and integration tests do not certify those external services. Follow the README setup and perform the two-account production smoke test once configured.
