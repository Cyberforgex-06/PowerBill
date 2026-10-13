# PowerBill

Electricity bill management system with a responsive Next.js frontend and Flask API backed by PostgreSQL.

## Project layout

- `powerbill/frontend`: customer, billing officer and administrator interfaces.
- `powerbill/backend`: authentication, meter readings, billing, payment records and receipts.
- `powerbill/reports`: implementation and verification reports.
- `render.yaml`: deployment blueprint for this repository’s `main` branch.

## Setup

See [PowerBill documentation](powerbill/README.md), [deployment guide](powerbill/DEPLOYMENT.md), [frontend guide](powerbill/frontend/README.md) and [backend guide](powerbill/backend/README.md). Configure database credentials and service secrets in the deployment environment.

## Source snapshot

Copied from `Cyberforgex-06/PowerFlow`, branch `powerbill-production`, commit `35577bb9c1c1036e172009afa94c3bbaed20e1e7`. This standalone repository contains the PowerBill project only.
