# Lightweight Gstack Adaptation

## Why this exists

We reviewed `gstack` and decided not to install the full stack.

Reasons:

- it adds telemetry / analytics behavior
- it expects Bun and its own setup flow
- it changes global skill wiring
- it includes browser-cookie workflows we do not need

What we *do* want is the good part:

- stronger planning
- stronger QA
- stronger investigation

This document defines a lightweight version of those workflows for PSI-G without:

- telemetry
- cookie tooling
- global machine changes
- third-party setup scripts

## The 4 workflows we keep

### 1. Plan Review

Purpose:

- lock the product / engineering plan before coding
- reduce rework
- force explicit decisions on data model, states, and edge cases

Use this before:

- VIP rule changes
- payment flow changes
- orb progression changes
- new mission system work
- Firebase data model changes

Checklist:

- What is the user-facing goal?
- What exact state fields do we need?
- What are the free vs VIP rules?
- What happens on expiry?
- What happens on retry, refresh, logout, or reinstall?
- What data must persist locally?
- What data must persist in backend / Firebase?
- What happens on failure midway?
- What tests prove the behavior?

Expected output:

- one short written spec
- one explicit implementation order
- one list of edge cases

PSI-G examples:

- `VIP is now 30 days`
- `VIP gives 1 awakened orb + full audio library`
- `free users unlock awakening with 7 days x 7 minutes`
- `VIP users unlock awakening with 7 days x 5 minutes`

### 2. World QA

Purpose:

- validate the app in the actual World Mini App environment
- prevent payment / auth / contacts / permission regressions

Use this before:

- any payment change
- any wallet auth change
- any gift / contacts change
- any release candidate

Test tiers:

- Quick:
  - sign in
  - app opens in World App
  - no fatal UI break
- Standard:
  - sign in
  - VIP purchase path
  - profile state
  - gift send flow
  - meditation audio access
- Exhaustive:
  - all of Standard
  - expiry / reset scenarios
  - payment retry edge cases
  - refresh / reopen / reinstall behavior

World QA checklist:

- Does sign-in succeed?
- Does profile show the expected username?
- Does VIP button price match the backend?
- After payment, can the user accidentally pay twice?
- If payment succeeds, does the app unlock correctly?
- If backend confirm is slow, does the app mislead the user?
- Does gifting succeed in World App?
- Do Firebase writes succeed?
- Do VIP-only audio gates behave correctly?

Expected output:

- findings first
- exact repro steps
- severity order:
  - payment safety
  - auth failures
  - gifting/data loss
  - content gating
  - visual polish

### 3. Investigate

Purpose:

- debug one problem deeply
- find the real root cause instead of surface patching

Use this when:

- payment behaves inconsistently
- World App payload shape is unclear
- Firebase writes sometimes fail
- one page behaves differently after refresh

Investigation loop:

1. state the symptom in plain language
2. identify where the truth should live
3. inspect the actual payloads / stored state / backend assumptions
4. isolate whether the bug is:
   - frontend state
   - local persistence
   - World payload shape
   - backend verification
   - Firebase rule / auth issue
5. fix the root cause
6. re-test the exact repro

Expected output:

- symptom
- root cause
- fix
- what was verified after the fix

### 4. World App Support

Purpose:

- keep PSI-G aligned with the latest World Mini App standards
- catch review, auth, pay, and permission mismatches before release

Use this before:

- release candidates
- MiniKit auth changes
- payment or VIP changes
- notification or contacts changes

Primary reference:

- [World App Support Agent](./world-app-support-agent.md)

Expected output:

- findings ordered by risk
- smallest safe fix
- direct World docs references

## PSI-G operating rules

These are the local rules for our version of the workflow.

### Rule 1: Payment safety beats elegance

If the choice is between:

- a polished but risky payment flow
- a clunky but safe payment flow

Choose safe.

### Rule 2: Never tell users to pay again if there is evidence they already paid

If World wallet history or transaction payload indicates funds moved:

- preserve access
- preserve lock
- reconcile in background
- never suggest retry payment blindly

### Rule 3: Separate 3 states clearly

For premium access, distinguish:

- `not_purchased`
- `payment_pending_confirmation`
- `active`
- `expired`

Do not collapse them into one boolean if the product logic depends on them.

### Rule 4: World App truth beats local guess

When local state and World transaction evidence disagree:

- trust the transaction evidence more than UI assumptions

### Rule 5: Product rule changes need written specs first

Before implementing changes like:

- 30-day VIP
- audio gating
- awakened orb gifting
- mission acceleration

write the spec first, then code.

## Recommended PSI-G workflow

For any serious feature:

1. `Plan Review`
   - write or update the short spec
2. `Implement`
   - smallest correct version first
3. `Investigate`
   - if reality differs from expected behavior
4. `World QA`
   - verify in actual World App
5. `Polish`
   - improve UX after safety is correct

## Current best use inside this project

Most useful immediate applications:

- VIP 30-day expiration design
- meditation audio free vs VIP split
- mission-based orb unlock system
- payment safety and duplicate-charge prevention
- gift + Firebase reliability in World App

## Current recommendation

Do not install `gstack`.

Instead:

- keep this lightweight workflow doc in-repo
- use it as the team operating system
- selectively create small local tools only when a workflow repeatedly hurts

That gives PSI-G the value of gstack's process without importing its baggage.
