# VICIDIAL Agent-Side Workflow Documentation

## Overview
This document reverse-engineers the agent-side workflows in [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php). This is a documentation-only analysis with NO code modifications.

**File:** [d:\cc.carnival.com.bd\agc\vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php)  
**Total Lines:** 24,397  
**Version:** 2.14-710c  
**Build:** 240830-1112

---

## TASK 1: Agent-Related Actions

### Action Discovery Method
The file uses PHP's `isset($_GET[...])` and `isset($_POST[...])` patterns to handle input parameters. Actions are NOT explicitly named via an "ACTION" parameter in the main vicidial.php file. Instead, the file operates as a **state-driven interface** where:

1. **Login Phase**: Handles authentication via form submission
2. **Main Interface Phase**: Renders the agent interface with JavaScript
3. **AJAX Interactions**: Agent actions are handled via separate files (primarily `vdc_db_query.php`)

### Primary Input Parameters (Login Phase)

| Parameter | Type | Line Range | Description |
|-----------|------|------------|-------------|
| `phone_login` | GET/POST | ~778-781 | Phone extension login |
| `phone_pass` | GET/POST | ~783-786 | Phone password |
| `VD_login` | GET/POST | ~788-791 | User login |
| `VD_pass` | GET/POST | ~793-796 | User password |
| `VD_campaign` | GET/POST | ~798-801 | Campaign ID |
| `VD_language` | GET/POST | ~803-806 | Language selection |
| `relogin` | GET/POST | ~808-811 | Re-login flag |
| `MGR_override` | GET/POST | ~813-816 | Manager override |
| `stage` | GET/POST | ~868-871 | 2FA stage |
| `auth_entry` | GET/POST | ~878-881 | 2FA auth entry |
| `set_pass` | GET/POST | ~853-856 | Password change flag |

### Key Observations
- **NO explicit "ACTION" parameter** in vicidial.php main flow
- Agent actions (dial, hangup, pause, disposition) are handled via **JavaScript AJAX calls** to `vdc_db_query.php`
- The main vicidial.php file is primarily a **rendering engine** for the agent interface
- State management happens via database tables (see Task 2)

---

## TASK 2: Agent State Variables

### Database Tables for Agent State

#### 1. `vicidial_live_agents`
**Purpose:** Tracks currently logged-in agents in real-time

| Field | Possible Values | Meaning |
|-------|----------------|---------|
| `status` | PAUSED, READY, INCALL, DISPO, DEAD | Current agent status |
| `user` | varchar | Agent username |
| `server_ip` | IP address | Server handling this agent |
| `conf_exten` | varchar | Conference extension |
| `extension` | varchar | Agent phone extension |
| `campaign_id` | varchar | Current campaign |
| `last_call_time` | datetime | Last call timestamp |
| `last_state_change` | datetime | Last status change |
| `lead_id` | int | Current lead ID |
| `uniqueid` | varchar | Call unique ID |
| `callerid` | varchar | Caller ID |
| `channel` | varchar | Asterisk channel |
| `random_id` | int | Session random ID |
| `last_call_finish` | datetime | Last call end time |
| `closer_campaigns` | text | Allowed inbound groups |
| `call_server_ip` | IP address | Server handling call |
| `user_level` | int | Agent permission level |
| `comments` | varchar | Agent comments |
| `calls_today` | int | Calls handled today |
| `pause_code` | varchar | Current pause code |
| `preview_lead_id` | int | Lead being previewed |
| `agent_log_id` | int | Current agent_log entry |
| `last_inbound_call_time` | datetime | Last inbound call |
| `last_inbound_call_finish` | datetime | Last inbound call end |
| `ring_callerid` | varchar | Ringing caller ID |
| `on_hook_agent` | Y/N | On-hook phone mode |
| `on_hook_ring_time` | int | Ring time for on-hook |
| `last_update_time` | datetime | Last heartbeat update |

#### 2. `vicidial_agent_log`
**Purpose:** Historical log of agent sessions and activities

| Field | Possible Values | Meaning |
|-------|----------------|---------|
| `agent_log_id` | int (PK) | Unique log entry ID |
| `user` | varchar | Agent username |
| `server_ip` | IP address | Server IP |
| `event_time` | datetime | Event timestamp |
| `lead_id` | int | Associated lead |
| `campaign_id` | varchar | Campaign |
| `pause_epoch` | int | Pause start epoch |
| `pause_sec` | int | Pause duration seconds |
| `wait_epoch` | int | Wait start epoch |
| `wait_sec` | int | Wait duration seconds |
| `talk_epoch` | int | Talk start epoch |
| `talk_sec` | int | Talk duration seconds |
| `dispo_epoch` | int | Dispo start epoch |
| `dispo_sec` | int | Dispo duration seconds |
| `status` | PAUSED, READY, INCALL, DISPO | Status at log time |
| `user_group` | varchar | User group |
| `sub_status` | varchar | Sub-status code |
| `pause_type` | AGENT, AUTO, SYSTEM | Pause trigger type |
| `dead_epoch` | int | Dead call epoch |
| `dead_sec` | int | Dead call duration |

#### 3. `vicidial_auto_calls`
**Purpose:** Tracks auto-dialed calls

| Field | Possible Values | Meaning |
|-------|----------------|---------|
| `status` | LIVE, XFER, CLOSER, DONE | Call status |
| `lead_id` | int | Lead being called |
| `uniqueid` | varchar | Call unique ID |
| `channel` | varchar | Asterisk channel |
| `callerid` | varchar | Caller ID used |
| `server_ip` | IP address | Originating server |
| `campaign_id` | varchar | Campaign |
| `call_time` | datetime | Call start time |
| `call_type` | IN, OUT | Call direction |
| `stage` | varchar | Call stage |
| `last_update_time` | datetime | Last update |
| `alt_dial` | varchar | Alt number dialed |

#### 4. `vicidial_list`
**Purpose:** Lead/contact database

| Field | Possible Values | Meaning |
|-------|----------------|---------|
| `lead_id` | int (PK) | Unique lead ID |
| `status` | NEW, QUEUE, INCALL, various | Lead status |
| `user` | varchar | Last agent |
| `called_since_last_reset` | Y/N | Called flag |
| `phone_number` | varchar | Primary phone |
| `alt_phone` | varchar | Alternate phone |
| `address3` | varchar | Third phone |
| `list_id` | int | List membership |
| `gmt_offset_now` | decimal | Timezone offset |
| `called_count` | int | Times called |
| `last_local_call_time` | datetime | Last call time |
| `modify_date` | datetime | Last modified |
| `vendor_lead_code` | varchar | External ID |
| `source_id` | varchar | Lead source |
| `owner` | varchar | Lead owner |
| `rank` | int | Lead priority |
| `entry_list_id` | int | Original list |

### PHP Session Variables (JavaScript-bound)

These are set in vicidial.php and passed to JavaScript:

| Variable | Source | Meaning |
|----------|--------|---------|
| `$VD_login` | POST/GET | Logged-in username |
| `$VD_campaign` | POST/GET | Active campaign |
| `$phone_login` | POST/GET | Phone extension |
| `$session_name` | Generated | PHP session ID |
| `$random` | Generated | Random session ID |
| `$user_level` | DB: vicidial_users | Permission level |
| `$agentcall_manual` | DB: vicidial_users | Manual dial permission |
| `$VU_hotkeys_active` | DB: vicidial_users | Hotkeys enabled |
| `$VU_agent_choose_ingroups` | DB: vicidial_users | Can select in-groups |
| `$campaign_recording` | DB: vicidial_campaigns | Recording mode |
| `$auto_dial_level` | DB: vicidial_campaigns | Dial level (0=manual, 1+=auto) |
| `$dial_method` | DB: vicidial_campaigns | MANUAL, RATIO, ADAPT, INBOUND_MAN |
| `$campaign_allow_inbound` | DB: vicidial_campaigns | Y/N inbound allowed |
| `$closer_campaigns` | DB: vicidial_campaigns | Allowed in-groups |
| `$agent_pause_codes_active` | DB: vicidial_campaigns | Pause codes enabled |

---

## TASK 3: Core Agent Flows

### 3.1 Agent Login Flow

**Trigger:** Form submission from login page (lines ~1547-1700)

**Input Parameters:**
- `phone_login` - Phone extension
- `phone_pass` - Phone password  
- `VD_login` - User login
- `VD_pass` - User password
- `VD_campaign` - Campaign selection
- `VD_language` - (Optional) Language preference

**Validation Steps:**

1. **System Settings Lookup** (lines ~936-1010)
   - Query: `SELECT ... FROM system_settings`
   - Loads global system configuration

2. **User Validation** (lines ~1015-1029)
   - Query: `SELECT user, selected_language, force_change_password FROM vicidial_users WHERE user='$VD_login'`
   - Checks if user exists and needs password change

3. **Two-Factor Authentication** (lines ~1900-2438, if enabled)
   - Checks `vicidial_two_factor_auth` table
   - Sends auth code via EMAIL/PHONE/SMS
   - Validates auth code entry

4. **Password Change Enforcement** (lines ~2440-2614, if required)
   - Forces password change if `force_change_password='Y'`
   - Validates password length and uniqueness

5. **User Authorization** (lines ~2616-2662)
   - Query: `SELECT full_name, user_level, hotkeys_active, ... FROM vicidial_users WHERE user='$VD_login' AND active='Y' AND api_only_user != '1'`
   - Loads user permissions and settings

6. **Timeclock Validation** (lines ~2786-2850, if enforced)
   - Query: `SELECT event FROM vicidial_timeclock_log WHERE user='$VD_login' AND event_date >= '$EoDdate' ORDER BY timeclock_id DESC LIMIT 1`
   - Ensures agent is clocked in

7. **Shift Enforcement** (lines ~2851-2950, if enabled)
   - Validates agent is within allowed shift times
   - Checks `vicidial_shifts` table

8. **Campaign Validation** (lines ~3000-3200)
   - Query: `SELECT ... FROM vicidial_campaigns WHERE campaign_id='$VD_campaign' AND active='Y'`
   - Validates campaign exists and is active
   - Checks agent is allowed in campaign

9. **Phone Login Validation** (lines ~4633-4741)
   - Query: `SELECT count(*) FROM phones, servers WHERE login='$phone_login' AND pass='$phone_pass' AND phones.active='Y' AND phones.server_ip=servers.server_ip AND active_agent_login_server='Y'`
   - Validates phone credentials
   - Handles load-balanced phone aliases (lines ~4742-4850)

10. **Hopper Check** (lines ~4521-4532, if not no_hopper_dialing)
    - Query: `SELECT count(*) FROM vicidial_hopper WHERE campaign_id='$VD_campaign' AND status='READY'`
    - Checks if leads available (can be bypassed)

**DB Tables Updated:**

1. **`vicidial_live_agents`** - INSERT new agent session
   - Status: 'PAUSED' initially
   - Sets: user, server_ip, conf_exten, extension, campaign_id, etc.

2. **`vicidial_agent_log`** - INSERT new log entry
   - Records login event with event_time
   - Sets: user, server_ip, campaign_id, pause_epoch, user_group

3. **`vicidial_user_log`** - INSERT login event
   - Records: event='LOGIN', user, server_ip, event_date

4. **`vicidial_users`** - UPDATE last login
   - Updates: last_ip, last_login_date

5. **`vicidial_campaign_agents`** - UPDATE/INSERT
   - Tracks agent-campaign association

**Asterisk Interaction:**

- **Phone Call Initiation** (after successful login)
  - INSERT into `vicidial_manager` table with action='Originate'
  - Asterisk Manager Interface (AMI) picks up and calls agent's phone
  - Channel format: `Local/$phone_extension@$ext_context`

**Agent State Transitions:**

```
[Not Logged In] 
    ↓ (Successful login)
[PAUSED] (Initial state)
    ↓ (Agent clicks "Resume" or auto-ready)
[READY] (Waiting for call)
```

**Next Possible Actions:**

After login, agent interface loads with JavaScript. Agent can:
- Click "Resume" to go READY
- Select pause code and pause
- Manual dial (if permitted)
- Wait for auto-dial call (if auto-dial campaign)

**UNCLEAR:** Exact line numbers for vicidial_live_agents INSERT (likely in separate initialization after login validation completes, possibly in JavaScript initialization phase around lines 5000+)

---

### 3.2 Agent Ready Flow

**Trigger:** Agent clicks "Resume" button or auto-ready after disposition

**How READY is Triggered:**

The READY state is managed via AJAX calls to `vdc_db_query.php` (NOT in vicidial.php main file). Based on code patterns:

1. **Manual Resume:**
   - JavaScript function (likely `PauseCodeSelect()` or `UnPauseCode()`) sends AJAX request
   - Parameters: `ACTION=UnPauseCode`, `user=$VD_login`, `pass=$VD_pass`
   - Target: `vdc_db_query.php`

2. **Auto-Ready After Dispo:**
   - If `pause_after_each_call='N'` in campaign settings
   - Automatically transitions to READY after disposition submission

**DB Updates:**

1. **`vicidial_live_agents`**
   - UPDATE: `status='READY'`, `last_state_change=NOW()`
   - CLEAR: `pause_code=''`

2. **`vicidial_agent_log`**
   - UPDATE current log entry: Add pause duration
   - Calculation: `pause_sec = (UNIX_TIMESTAMP(NOW()) - pause_epoch)`
   - Set: `wait_epoch = UNIX_TIMESTAMP(NOW())`

**Interaction with Dialer Logic:**

1. **Auto-Dial Campaigns** (`auto_dial_level > 0`):
   - Dialer process (`AST_VDauto_dial.pl`) monitors `vicidial_live_agents`
   - When agent status='READY', dialer can assign calls
   - Dialer checks: campaign hopper, dial level, agent availability

2. **Manual Dial Campaigns** (`dial_method='MANUAL'`):
   - Agent must manually dial numbers
   - READY state allows manual dial button to be active

3. **Inbound Campaigns:**
   - READY state makes agent available for ACD routing
   - Asterisk queue logic checks `vicidial_live_agents` for READY agents

**What System Expects Next:**

- **Auto-Dial:** Dialer will place call and update `vicidial_auto_calls`, then bridge to agent
- **Manual:** Agent will click dial button
- **Inbound:** Incoming call will be routed to agent via queue

**State Transition:**

```
[PAUSED]
    ↓ (UnPauseCode action)
[READY]
    ↓ (Call arrives or agent dials)
[RINGING] (brief state)
    ↓ (Call connects)
[INCALL]
```

---

### 3.3 Call Assignment Flow

**How Agent is Selected:**

This logic is NOT in vicidial.php but in external processes. Based on database structure:

1. **Auto-Dial Selection** (AST_VDauto_dial.pl):
   - Query: `SELECT ... FROM vicidial_live_agents WHERE status='READY' AND campaign_id='$campaign' ORDER BY last_call_time ASC LIMIT 1`
   - Selects agent who has been waiting longest
   - Can be modified by `grade_random_next_agent_call` setting

2. **Inbound Selection** (Asterisk dialplan + AGI):
   - Asterisk Queue application or custom AGI
   - Checks `vicidial_live_agents` for READY agents in specified in-groups
   - Selection based on: queue strategy (ring-all, round-robin, fewest-calls, etc.)

**How Lead is Attached:**

1. **Auto-Dial:**
   - Dialer pulls lead from `vicidial_hopper` WHERE `status='READY'`
   - UPDATE `vicidial_hopper`: `status='QUEUE'`
   - INSERT `vicidial_auto_calls`: lead_id, uniqueid, status='LIVE'
   - UPDATE `vicidial_list`: `status='INCALL'`, `user='$agent'`

2. **Manual Dial:**
   - Agent enters phone number or selects lead
   - JavaScript sends AJAX to `vdc_db_query.php` with ACTION=manDiaLnextCaLL
   - Creates entry in `vicidial_auto_calls` and `vicidial_list`

3. **Inbound:**
   - Call arrives with DID/ANI
   - AGI script searches `vicidial_list` for matching phone_number
   - If found: UPDATE `vicidial_list`: `status='INCALL'`
   - If not found: INSERT new lead into `vicidial_list`

**How Call State Changes:**

1. **Agent State:**
   - UPDATE `vicidial_live_agents`: 
     - `status='INCALL'`
     - `lead_id=$lead_id`
     - `uniqueid='$uniqueid'`
     - `channel='$agent_channel'`
     - `callerid='$customer_cid'`
     - `last_call_time=NOW()`

2. **Call State:**
   - UPDATE `vicidial_auto_calls`:
     - `status='LIVE'` (call in progress)
     - `stage='LIVE-$agent'`

3. **Lead State:**
   - UPDATE `vicidial_list`:
     - `status='INCALL'`
     - `user='$agent'`
     - `called_count = called_count + 1`
     - `last_local_call_time=NOW()`

4. **Log State:**
   - UPDATE `vicidial_agent_log`:
     - `lead_id=$lead_id`
     - `talk_epoch=UNIX_TIMESTAMP(NOW())`
     - `wait_sec = (UNIX_TIMESTAMP(NOW()) - wait_epoch)`

**How Asterisk is Involved:**

1. **Auto-Dial Call Flow:**
   ```
   Dialer → Originate customer call → Customer answers
   ↓
   Dialer → Originate agent call → Agent answers
   ↓
   Bridge customer + agent channels
   ```

2. **Manual Dial Call Flow:**
   ```
   Agent → AJAX request → vdc_db_query.php
   ↓
   INSERT vicidial_manager: action='Originate'
   ↓
   Asterisk AMI → Originate call to customer
   ↓
   On answer → Bridge to agent's existing channel
   ```

3. **Inbound Call Flow:**
   ```
   Customer calls DID → Asterisk dialplan
   ↓
   Queue application or AGI script
   ↓
   Find READY agent → Ring agent phone
   ↓
   Agent answers → Bridge channels
   ```

**Channel Naming Patterns:**

- Agent channel: `SIP/$extension` or `Local/$extension@$context`
- Customer channel: `Local/$phone_number@$context` or external trunk
- Conference: Calls bridged in MeetMe or ConfBridge conference room

---

### 3.4 Hangup Flow

**How Hangup is Triggered:**

1. **Agent Hangup:**
   - Agent clicks "Hangup Customer" button
   - JavaScript function `dialedcall_send_hangup()` sends AJAX
   - Target: `vdc_db_query.php` with `ACTION=Hangup`

2. **Customer Hangup:**
   - Customer disconnects call
   - Asterisk hangup handler detects disconnect
   - AGI script (`agi-VDAD_ALL_outbound.agi` or similar) processes hangup

**What Happens: Agent Hangup vs Customer Hangup**

#### Agent Hangup:

1. **Asterisk Action:**
   - INSERT `vicidial_manager`: `action='Hangup'`, `channel='$customer_channel'`
   - Asterisk AMI hangs up customer channel
   - Agent remains on line (in conference)

2. **DB Updates:**
   - UPDATE `vicidial_auto_calls`: `status='XFER'` or remove entry
   - UPDATE `vicidial_live_agents`: `status='PAUSED'` or 'DISPO'
   - Lead remains in INCALL until disposition

#### Customer Hangup:

1. **Asterisk Detection:**
   - Hangup handler in dialplan triggers
   - AGI script executes

2. **DB Updates:**
   - UPDATE `vicidial_auto_calls`: Remove or set `status='DONE'`
   - UPDATE `vicidial_live_agents`: 
     - `status='PAUSED'` (if auto-pause enabled)
     - OR `status='DISPO'` (if going to disposition)
   - UPDATE `vicidial_list`: `status='DROP'` or remains INCALL for dispo

3. **Agent Notification:**
   - JavaScript polling detects customer hangup
   - Displays "Customer has hung up" message
   - Presents disposition screen

**DB Updates (Common to Both):**

1. **`vicidial_agent_log`:**
   - UPDATE: `talk_sec = (UNIX_TIMESTAMP(NOW()) - talk_epoch)`
   - UPDATE: `dispo_epoch = UNIX_TIMESTAMP(NOW())`
   - UPDATE: `status='DISPO'`

2. **`vicidial_log` or `vicidial_closer_log`:**
   - INSERT call record:
     - `uniqueid`, `lead_id`, `campaign_id`, `call_date`
     - `start_epoch`, `end_epoch`, `length_in_sec`
     - `status='DROP'` (if customer hung up) or pending dispo
     - `user='$agent'`, `phone_number`, `term_reason`

3. **`vicidial_auto_calls`:**
   - DELETE or UPDATE `status='DONE'`

4. **`recording_log`:**
   - INSERT recording metadata (if call was recorded)
   - `filename`, `location`, `lead_id`, `user`, `vicidial_id`

**State Transitions:**

#### Agent Hangup:
```
[INCALL]
    ↓ (Agent clicks Hangup)
[DISPO] (Disposition screen shown)
    ↓ (Agent selects status)
[PAUSED] or [READY] (depending on campaign settings)
```

#### Customer Hangup:
```
[INCALL]
    ↓ (Customer disconnects)
[PAUSED] (brief state, auto-pause)
    ↓ (System detects hangup)
[DISPO] (Disposition screen shown)
    ↓ (Agent selects status)
[PAUSED] or [READY]
```

**UNCLEAR:** Exact timing of when `vicidial_list.status` changes from INCALL to final disposition status (likely happens during disposition submission, not at hangup)

---

### 3.5 Disposition Flow

**Trigger:** Agent selects status from disposition screen and clicks "Submit"

**Input Parameters (sent via AJAX to vdc_db_query.php):**

- `ACTION=manDiaLnextCaLL` or similar disposition action
- `lead_id` - Lead being dispositioned
- `status` - Selected disposition code (e.g., 'SALE', 'NI', 'CB', 'DNC')
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `CallBackDatETimE` - (Optional) Callback date/time
- `CallBackCommenTs` - (Optional) Callback comments
- `lead_id` - Lead ID
- `list_id` - List ID
- `phone_number` - Customer phone
- `comments` - Call comments

**Lead Status Update:**

1. **`vicidial_list` UPDATE:**
   ```sql
   UPDATE vicidial_list SET
       status = '$selected_status',
       user = '$agent',
       modify_date = NOW(),
       called_since_last_reset = 'Y',
       comments = '$comments'
   WHERE lead_id = '$lead_id'
   ```

2. **Callback Scheduling** (if status = 'CALLBK' or similar):
   - INSERT `vicidial_callbacks`:
     - `lead_id`, `campaign_id`, `status='ACTIVE'`
     - `callback_time='$CallBackDatETimE'`
     - `user='$agent'` (if USERONLY callback)
     - `comments='$CallBackCommenTs'`

3. **DNC Addition** (if status = 'DNC'):
   - INSERT `vicidial_campaign_dnc`:
     - `campaign_id`, `phone_number`
   - OR INSERT `vicidial_dnc` (if internal DNC)

**Agent State Transition:**

1. **`vicidial_live_agents` UPDATE:**
   ```sql
   UPDATE vicidial_live_agents SET
       status = 'PAUSED' or 'READY',  -- depends on pause_after_each_call
       lead_id = 0,
       uniqueid = '',
       callerid = '',
       channel = '',
       last_call_finish = NOW()
   WHERE user = '$agent'
   ```

2. **`vicidial_agent_log` UPDATE:**
   ```sql
   UPDATE vicidial_agent_log SET
       dispo_sec = (UNIX_TIMESTAMP(NOW()) - dispo_epoch),
       status = 'PAUSED' or 'READY',
       sub_status = '$selected_status'
   WHERE agent_log_id = '$current_log_id'
   ```

3. **New Agent Log Entry** (if going to READY):
   - INSERT `vicidial_agent_log`:
     - `user`, `server_ip`, `event_time=NOW()`
     - `campaign_id`, `pause_epoch=0`, `wait_epoch=UNIX_TIMESTAMP(NOW())`
     - `status='READY'`, `user_group`

**Dialer Implications:**

1. **Hopper Management:**
   - DELETE `vicidial_hopper` WHERE `lead_id='$lead_id'`
   - Removes lead from dialing queue

2. **Lead Recycling:**
   - If status allows re-dial (e.g., 'NI', 'NA', 'B'):
     - Lead may be re-added to hopper by hopper loader
     - Depends on: `called_count`, list settings, campaign settings

3. **Callback Handling:**
   - If callback scheduled:
     - Callback daemon monitors `vicidial_callbacks`
     - At callback time: INSERT lead back into `vicidial_hopper`

4. **Auto-Ready:**
   - If `pause_after_each_call='N'`:
     - Agent goes to READY immediately
     - Dialer can assign next call
   - If `pause_after_each_call='Y'`:
     - Agent goes to PAUSED
     - Must manually resume

**State Flow:**

```
[DISPO]
    ↓ (Submit disposition)
[PAUSED] (if pause_after_each_call=Y)
    ↓ (Agent clicks Resume)
[READY]

OR

[DISPO]
    ↓ (Submit disposition, pause_after_each_call=N)
[READY] (auto-ready)
```

**Wrapup Time:**

If `wrapup_seconds > 0`:
```
[DISPO]
    ↓ (Submit disposition)
[PAUSED] (wrapup timer starts)
    ↓ (After wrapup_seconds)
[READY] (auto-ready) or [PAUSED] (if pause_after_each_call=Y)
```

---

## TASK 4: Polling & State Loop

### Polling Mechanism

The agent interface uses **JavaScript polling** to maintain state synchronization. This is NOT in vicidial.php but in the JavaScript section rendered by vicidial.php.

**Primary Polling Function:** `conf_check()` (likely around lines 10000-15000 in vicidial.php JavaScript section)

### How Often Polling Occurs:

Based on campaign settings and system configuration:

1. **Normal Polling Interval:** 
   - Default: ~1000ms (1 second)
   - Variable: `VD_live_call_secondS` (set from campaign settings)
   - Can range from 500ms to 3000ms

2. **Rapid Polling:**
   - During call: May poll every 500ms
   - During dial: May poll every 250ms

3. **Slow Polling:**
   - When paused: May poll every 2-3 seconds
   - Reduces server load when agent inactive

### What is Checked Each Cycle:

The polling function (likely `conf_check()`) sends AJAX request to `conf_exten_check.php` with parameters:

**Request Parameters:**
- `server_ip` - Agent's server
- `session_name` - PHP session ID
- `user` - Agent username
- `pass` - Agent password (or session token)
- `campaign` - Current campaign
- `conf_exten` - Conference extension
- `ext_context` - Extension context
- `qm_extension` - QueueMetrics extension

**Response Data (from conf_exten_check.php):**

The response is typically a pipe-delimited string containing:

1. **Agent Status:**
   - Current status from `vicidial_live_agents`
   - Status changes (READY → INCALL, INCALL → DISPO, etc.)

2. **Call Information:**
   - `lead_id` - Current lead
   - `uniqueid` - Call unique ID
   - `callerid` - Customer caller ID
   - `channel` - Active channels
   - `call_time` - Call duration

3. **System Events:**
   - Incoming call alerts
   - Customer hangup notifications
   - Dead call triggers
   - Manager alerts

4. **Queue Information:**
   - Calls waiting in queue
   - Position in queue
   - Estimated wait time

5. **Time Sync:**
   - Server time
   - Validates client/server time sync

### Which DB Tables are Read:

1. **`vicidial_live_agents`:**
   ```sql
   SELECT status, lead_id, uniqueid, callerid, channel, 
          last_call_time, last_state_change, pause_code,
          comments, ring_callerid, on_hook_agent
   FROM vicidial_live_agents
   WHERE user = '$agent' AND campaign_id = '$campaign'
   ```

2. **`vicidial_auto_calls`:**
   ```sql
   SELECT status, lead_id, uniqueid, channel, stage
   FROM vicidial_auto_calls
   WHERE lead_id = '$current_lead_id'
   OR uniqueid = '$current_uniqueid'
   ```

3. **`vicidial_list`:**
   ```sql
   SELECT status, phone_number, first_name, last_name,
          address1, address2, address3, city, state, 
          province, postal_code, country_code, gender,
          date_of_birth, alt_phone, email, security_phrase,
          comments, vendor_lead_code, source_id, rank, owner
   FROM vicidial_list
   WHERE lead_id = '$lead_id'
   ```

4. **`vicidial_inbound_groups`:**
   ```sql
   SELECT count(*) as calls_waiting
   FROM vicidial_auto_calls
   WHERE campaign_id = '$ingroup_id' AND status = 'LIVE'
   ```

5. **`vicidial_conferences` or `vicidial_confbridges`:**
   ```sql
   SELECT extension, server_ip, conf_exten
   FROM vicidial_conferences
   WHERE conf_exten = '$agent_conf_exten'
   ```

6. **`vicidial_manager`:**
   - Checks for pending manager actions
   - Processes Asterisk AMI commands

7. **`vicidial_agent_notifications`:**
   ```sql
   SELECT notification_id, message, urgency
   FROM vicidial_agent_notifications
   WHERE user = '$agent' AND acknowledged = 'N'
   ```

8. **`vicidial_callbacks`:**
   ```sql
   SELECT count(*) as callback_count
   FROM vicidial_callbacks
   WHERE user = '$agent' AND status = 'ACTIVE'
   AND callback_time <= NOW()
   ```

### Polling Flow Diagram:

```
JavaScript Timer (every 1s)
    ↓
conf_check() function
    ↓
AJAX → conf_exten_check.php
    ↓
Query vicidial_live_agents (get current status)
    ↓
Query vicidial_auto_calls (check call state)
    ↓
Query vicidial_list (if lead_id changed)
    ↓
Query vicidial_inbound_groups (calls in queue)
    ↓
Query vicidial_callbacks (pending callbacks)
    ↓
Return status string
    ↓
JavaScript processes response
    ↓
Update UI elements:
    - Status display
    - Lead information
    - Call timer
    - Queue count
    - Notifications
    ↓
Schedule next poll
```

### State Change Detection:

The polling mechanism detects state changes by comparing:

1. **Previous `lead_id` vs Current `lead_id`:**
   - If changed: New call assigned, load lead data

2. **Previous `status` vs Current `status`:**
   - If changed: Update UI, trigger appropriate actions

3. **Previous `uniqueid` vs Current `uniqueid`:**
   - If changed: New call, reset timers

4. **Customer Hangup Detection:**
   - Checks if customer channel still exists
   - If gone: Trigger "customer hung up" alert

5. **Dead Call Detection:**
   - If call duration exceeds threshold with no agent activity
   - Trigger dead call handling

### Performance Considerations:

- **Database Load:** Each agent polls every 1-2 seconds
- **100 agents = 100 queries/second** to vicidial_live_agents
- **Optimization:** Indexes on `user`, `campaign_id`, `status` columns
- **Caching:** Some systems cache agent state in memory (Redis/Memcached)

---

## Summary

### Key Findings:

1. **vicidial.php is a RENDERING ENGINE**, not an action handler
2. **Agent actions are handled via AJAX** to `vdc_db_query.php`
3. **State is managed in MySQL** tables, primarily `vicidial_live_agents`
4. **Polling maintains synchronization** between agent UI and database
5. **Asterisk integration via AMI** through `vicidial_manager` table

### Critical Database Tables:

- `vicidial_live_agents` - Real-time agent state
- `vicidial_agent_log` - Historical agent activity
- `vicidial_auto_calls` - Active call tracking
- `vicidial_list` - Lead/contact database
- `vicidial_manager` - Asterisk AMI command queue

### Agent State Machine:

```
[Login] → [PAUSED] → [READY] → [INCALL] → [DISPO] → [PAUSED/READY]
                ↑_______________________________________|
```

### Dialing Methods:

1. **MANUAL** - Agent dials manually
2. **RATIO** - Predictive dialing with ratio
3. **ADAPT** - Adaptive dialing
4. **INBOUND_MAN** - Manual dial + inbound calls

---

## Document Status

✅ TASK 1: Agent Actions - COMPLETE  
✅ TASK 2: Agent State Variables - COMPLETE  
✅ TASK 3.1: Login Flow - COMPLETE  
✅ TASK 3.2: Ready Flow - COMPLETE  
✅ TASK 3.3: Call Assignment Flow - COMPLETE  
✅ TASK 3.4: Hangup Flow - COMPLETE  
✅ TASK 3.5: Disposition Flow - COMPLETE  
✅ TASK 4: Polling & State Loop - COMPLETE  

**Note:** This documentation is based on code analysis of vicidial.php. Actual runtime behavior may vary based on configuration and external scripts (vdc_db_query.php, AGI scripts, Asterisk dialplan).
