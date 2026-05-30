# My Buddy

## Description

My Buddy is an agentic "life buddy." Users gets daily "nudges" across various life domains (friendships, dating, fitness, sleep, learning, career, etc.). Every day, per-domain agents retrieve that user's relevant memories, propose nudges, and then a deterministic "balance governor" picks the day's plan. Feedback from the user will then flow back into memory. Every user's nudges and memories are private to them.

## Project Origin

This is primarily a hobby project for me. The idea came to me, because I've noticed that I'm **really** good at following the directions of my running watch (a Garmin Forerunner 255). If it tells me that I need to run 40 minutes, I run 40 minutes. If it tells me I need to run for an hour, I run for an hour. If it tells me I need to do sprints, I do sprints. If it tells me I need a rest day, I take a rest day.

But I'm not nearly as good with other areas of my life, like journaling, or dating, or learning new tech topics. So I need a buddy that helps me keep track of these different life dimensions, and it will "nudge" me when I've neglected a certain area of life for too long.

That's My Buddy.

## Development Process

Again, this is primarily a hobby project for me. I'd like to try to write much of it by-hand, but I will be using Claude Code as well.

## Design

### Design Philosophy

**Design for scale, deploy modestly.** The data model is multi-tenant. The services will be stateless and horizontally scalable. However, it's a hobby project, so I want to keep the costs under $50 / month if possible. Scale is accounted for, even if it's not used.

### Design Decisions

1. **One database.** App state *and* RAG memory will both live in the same Postgres DB. We'll access the RAG memory with the `pgvector` extension. For a future v2, it could possibly use Amazon OpenSearch.

2. **Real RAG, not prompt-stuffing.** I want to do real RAG, so the nudge "memories" will be embedded and retrieved by semantic similarity + metadata filtering.

3. **Real authentication.** Again, I expect to actually use this, so the project will integrate with AWS Cognito for authentication. To protect user data, we'll use Postgres row-level security (RLS) to prevent cross-tenant leaks.

### Architecture Diagram

Pretty picture of the design, maybe by Claude:
```
┌─────────────┐   HTTPS     ┌───────────────────────────┐
│  React SPA  │ ──────────► │   API (Express/TS)        │
│ (S3+CFront) │ <────────── │  - verifies token -> user │
└─────────────┘  JWT in     │  - sets tenant context    │
                 cookie     │  - RAG service            │
                            │  - domain agents          │
                            │  - balance governor       │
                            └───────────┬───────────────┘
                  ┌─────────────────────┼───────────────────────┐
                  ▼                     ▼                       ▼
        ┌───────────────────┐  ┌───────────────────┐  ┌───────────────┐
        │ Postgres+pgvector │  │ LLM provider      │  │ Notifications │
        │ + Row-Level Sec.  │  │ (OpenAI/Anthropic)│  │ (SES email)   │
        │ - app tables      │  │ - embeddings      │  └───────────────┘
        │ - memory + vector │  │ - structured gen  │
        └───────────────────┘  └───────────────────┘
                  ▲
       daily fan-out (per user, per timezone)
   ┌──────────────┴─────────────────────────────┐
   │ EventBridge → orchestrator → SQS → workers │
   └────────────────────────────────────────────┘

   Auth: Cognito (or self-hosted) issues tokens · Redis/ElastiCache (sessions, cache,
   per-tenant rate limits) comes online with scale.
```

## Tech Stack

Here is the planned tech stack:

| Component | Choice | Why |
|---|---|---|
| Frontend | React (Vite) on S3 + CloudFront | static, cheap, scales trivially |
| API | Node + TypeScript + Express | stateless |
| DB | Postgres 15+ + `pgvector` | one DB for app state **and** RAG |
| Schema & migrations | **explicit SQL files** + a plain-SQL runner (postgrator/dbmate) | hand-written `CREATE TABLE`/RLS/roles are the single source of truth; the runner only applies & tracks them — no diffing, no auto-migration |
| Query layer | **raw `pg`** (node-postgres) + hand-written TS row types | a query layer only; never owns or migrates schema |
| Auth | **Cognito** | managed, scales, less surface to get wrong |
| LLM | OpenAI | preferred for consumer-facing apps |
| Queue (scale) | SQS (+ DLQ) | fan-out the daily run |
| Cache (scale) | ElastiCache (Redis) | sessions, hot reads, per-tenant limits |
| Scheduler | EventBridge Scheduler | per-timezone daily runs |
| Email | SES | near-free reminders |
| Secrets | Secrets Manager / SSM | no keys in code |
| IaC | Terraform or AWS CDK | reproducible |

## Build Plan

1. Postgres + `pgvector` locally (docker compose)
2. Create **explicit SQL migrations** (Tables, RLS policies, app role) applied by a plain-SQL runner.
3. Produce the basic scaffolding of the Node/TS + Express project.
4. Add local seed data for two test users for testing.
5. Build the data-access layer for per-request tenant-specific wrapper classes.
6. `RagService` + `LlmProvider` interfaces; embed/retrieve working against seed memories (scoped per user).
  * Validate embedding of local seed data.
  * Validate retrieval-augmented generation with local seed data.
7. One domain agent (e.g. friendship) producing a structured suggestion from retrieved memory.
8. Balance governor + `daily_plans`/`daily_plan_items`; daily run end-to-end (in-process loop).
9. Minimal React UI: today's plan + feedback buttons (feedback → new memories).
10. **Auth end-to-end** (Cognito): signup/login → token → API resolution per request. Verify isolation with two test users.
11. SES email reminders.
12. Deploy modest (App Runner + RDS + Cognito + S3/CloudFront + EventBridge Scheduler)
13. Budgets/billing alarms.

## Disclaimer

This is strictly a hobby project and portfolio project. The output from My Buddy should not be used as actual life coaching, mental health counseling, or lifestyle guidance. ***It is not a substitute for professional mental-health care; if you're in crisis, contact a qualified professional or a crisis hotline.***