# PSI-G Points / Token Economy Data Model

## Goal

This is the minimum viable data model for a PSI-G points / token economy.

It is deliberately small.

It is designed to support:

- VIP entitlement checks
- point balances and auditable ledger history
- mission / reward claims
- future tokenized rewards without rewriting the state model

The model is split into 3 blocks:

- user entitlement
- balance / ledger
- claims / rewards

## 1. User Entitlement

This block answers:

- what the user is allowed to access
- what is active, pending, expired, or permanently unlocked

### Table / document: `user_entitlements`

Recommended primary key:

- `user_id`

Minimum fields:

- `user_id`
  - internal stable app user id
- `wallet_address`
  - World wallet address currently linked to the user
- `world_username`
  - latest World username if available
- `vip_status`
  - enum:
    - `not_purchased`
    - `pending_confirmation`
    - `active`
    - `expired`
- `vip_activated_at`
  - nullable timestamp
- `vip_expires_at`
  - nullable timestamp
- `vip_source`
  - enum:
    - `world_pay`
    - `manual_grant`
    - `dev_mock`
- `vip_pending_reference`
  - nullable string
  - the current payment reference being confirmed
- `awakened_orb_count`
  - integer
  - number of awakened orbs the user owns
- `starter_pack_granted_at`
  - nullable timestamp
- `ambient_sound_tier`
  - enum:
    - `free`
    - `vip`
- `mission_threshold_tier`
  - enum:
    - `free`
    - `vip`
- `created_at`
  - timestamp
- `updated_at`
  - timestamp

### Optional but high-value entitlement fields

- `granted_shape_ids`
  - array of shape ids permanently granted to this user
- `temporary_shape_ids`
  - array of time-limited shape ids
- `granted_sound_ids`
  - array of permanently unlocked ambient sounds
- `temporary_sound_ids`
  - array of time-limited ambient sounds

Reason:

- this avoids mixing free core unlocks, mission unlocks, and VIP grants into one ambiguous list

## 2. Balance / Ledger

This block answers:

- how many points / tokens the user has
- how they got them
- where they spent them

Do not trust a naked balance field by itself.

Always keep an append-only ledger.

### Table / document: `user_balances`

Recommended primary key:

- `user_id`

Minimum fields:

- `user_id`
- `soft_points_balance`
  - integer
  - off-chain points used for missions, unlocks, and lightweight rewards
- `premium_token_balance`
  - decimal string
  - optional app-level premium token accounting if introduced later
- `last_ledger_event_at`
  - timestamp
- `updated_at`
  - timestamp

### Table / document: `balance_ledger`

Recommended primary key:

- `ledger_entry_id`

Minimum fields:

- `ledger_entry_id`
  - stable unique id
- `user_id`
- `asset_type`
  - enum:
    - `soft_points`
    - `premium_token`
    - `vip_credit`
- `direction`
  - enum:
    - `credit`
    - `debit`
- `amount`
  - integer for points or decimal string for token-like assets
- `balance_after`
  - optional but strongly recommended
- `reason_type`
  - enum:
    - `mission_reward`
    - `daily_checkin`
    - `gift_reward`
    - `vip_purchase`
    - `manual_adjustment`
    - `unlock_cost`
    - `refund`
- `reason_id`
  - mission id, reward id, payment reference, unlock id, etc.
- `reference`
  - nullable string
  - external payment or transaction reference
- `metadata`
  - JSON object for event-specific detail
- `created_at`
  - timestamp

Reason:

- points and token economy bugs are usually audit problems, not math problems
- the ledger is the source of truth when balance disputes happen

## 3. Claims / Rewards

This block answers:

- what rewards exist
- whether the user has earned them
- whether they have already claimed them

This is the section that prevents double-claiming.

### Table / document: `reward_definitions`

Recommended primary key:

- `reward_id`

Minimum fields:

- `reward_id`
- `reward_type`
  - enum:
    - `points`
    - `shape_unlock`
    - `ambient_sound_unlock`
    - `awakened_orb`
    - `vip_starter_pack`
    - `badge`
- `title`
- `description`
- `amount`
  - nullable
  - used for points / token rewards
- `shape_id`
  - nullable
- `sound_id`
  - nullable
- `is_repeatable`
  - boolean
- `created_at`
  - timestamp

### Table / document: `mission_completions`

Recommended primary key:

- `completion_id`

Minimum fields:

- `completion_id`
- `user_id`
- `mission_id`
- `completed_at`
- `threshold_tier_at_completion`
  - enum:
    - `free`
    - `vip`
- `progress_snapshot`
  - JSON object capturing the value that satisfied the mission
- `reward_claim_status`
  - enum:
    - `not_claimed`
    - `claimed`
    - `voided`
- `reward_claimed_at`
  - nullable timestamp

Reason:

- this prevents a mission unlocked under VIP from disappearing later when VIP expires
- completion should be a recorded fact, not only a live recalculation

### Table / document: `reward_claims`

Recommended primary key:

- `claim_id`

Minimum fields:

- `claim_id`
- `user_id`
- `reward_id`
- `source_type`
  - enum:
    - `mission`
    - `vip_purchase`
    - `seasonal_event`
    - `manual_grant`
- `source_id`
  - mission id, purchase reference, event id, etc.
- `claim_status`
  - enum:
    - `pending`
    - `granted`
    - `failed`
    - `reversed`
- `granted_at`
  - nullable timestamp
- `ledger_entry_id`
  - nullable
  - set when the claim affects points / token balance
- `entitlement_effect`
  - JSON object
  - describes what was granted:
    - shape id
    - sound id
    - awakened orb count
    - VIP starter pack
- `idempotency_key`
  - string
  - required to prevent duplicate reward grants
- `created_at`
  - timestamp
- `updated_at`
  - timestamp

## Recommended minimum implementation order

If PSI-G builds this incrementally, the safest order is:

1. `user_entitlements`
   - because VIP, ambient sound gating, and mission threshold tier already depend on it
2. `mission_completions`
   - because mission unlocks should become stable facts
3. `reward_claims`
   - to prevent duplicate grants
4. `balance_ledger`
   - before any real points economy becomes visible to users
5. `user_balances`
   - as a cached summary of the ledger

## Most important rule

Never let these 3 concerns blur together:

- entitlement
- balance
- reward claim

Example:

- a VIP purchase is an entitlement event
- a mission reward is a claim event
- points gained from that mission are a ledger event

They may happen in one user flow, but they should not be stored as one merged boolean.
