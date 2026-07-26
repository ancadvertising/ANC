# ANC ERP staging environment

This branch is the only source for the review environment. It must never deploy
to the production Worker, D1 database, R2 bucket, or Cloudflare Pages project.

## Isolated resources

| Component | Staging target |
| --- | --- |
| Frontend | `https://ancadvertising.github.io/ANC/` |
| Worker | `https://anc-marketing-erp-api-staging.anc-advertising.workers.dev` |
| D1 | `anc-erp-staging` |
| R2 | `anc-erp-files-staging` |

The `scripts/assert-staging-config.mjs` guard fails the workflow if a staging
binding points at a production resource or if a staging workflow is run from a
branch other than `staging`.

## Required GitHub configuration

1. Add repository secret `CLOUDFLARE_API_TOKEN`. Scope it only to the ANC
   account with Workers Scripts Edit, D1 Edit, and Workers R2 Storage Edit.
2. Add repository variable `CLOUDFLARE_ACCOUNT_ID` with
   `cbdd5ba9e651cd66fc572b8bb437651d`.
3. After storing the token, add repository variable
   CLOUDFLARE_DEPLOY_ENABLED=true. Until then the verification job runs but
   the automatic backend deploy job is safely skipped.
4. In the Google OAuth web client, add
   `https://ancadvertising.github.io` to Authorized JavaScript origins.
5. Configure GitHub Pages to use GitHub Actions as its publishing source.

## Local validation

```powershell
node scripts/assert-staging-config.mjs
node scripts/build-staging-frontend.mjs
Set-Location worker
npm.cmd test
npm.cmd run check:staging
```

## Deployment

Pushes to `staging` run two independent workflows:

- `staging-backend.yml` tests, initializes only the staging schema when needed,
  applies only staging migrations, and deploys with `--env staging`.
- `staging-frontend.yml` builds the SPA with the `/ANC/` base path and staging
  API URL, then deploys it to GitHub Pages.

Production deployment commands are intentionally absent from both workflows.
