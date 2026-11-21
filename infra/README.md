# Campus Connect — AWS infrastructure

Hosting is **AWS** (not Render). See root `DECISIONS.md`.

## Target stack (M1 skeleton)

| Piece | Service |
|-------|---------|
| Container images | Amazon ECR |
| Web (2+ tasks) + worker (1 task) | ECS Fargate |
| Load balancer + `/healthz` | Application Load Balancer |
| Redis | ElastiCache (Redis) |
| Secrets | SSM Parameter Store / Secrets Manager |

## Layout

- `infra/ecs/` — task definitions and service sketches (JSON)
- `infra/cloudformation/campus-connect-staging.yaml` — starter stack outline

## Deploy (human + CI later)

1. Create ECR repos `campus-connect-web` and `campus-connect-worker` (or one repo, two tags).
2. Build and push the app image (`Dockerfile` at repo root).
3. Create ElastiCache Redis; put `REDIS_URL` in SSM.
4. Apply/create ECS cluster, ALB, web service (desired count ≥ 2), worker service (desired count 1).
5. Set env from SSM: Sharetribe keys, Stripe publishable, `QR_SIGNING_SECRET`, etc.
6. Point DNS / `REACT_APP_MARKETPLACE_ROOT_URL` at the ALB HTTPS URL.

Staging acceptance for M1: HTTPS URL where `/` serves Campus Connect and `await ccSdk.ready; ccSdk.marketplace.show()` works in the browser console.
