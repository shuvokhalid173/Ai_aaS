# VICIDIAL Agent Flow to HTTP Endpoint Mapping

## Overview

This document maps the documented agent flows from [vicidial_agent_workflows.md](file:///C:/Users/Dotlines/.gemini/antigravity/brain/e78b8e5a-9d69-4356-95ff-b3c2ee0b563e/vicidial_agent_workflows.md) to existing VICIDIAL HTTP endpoints. This is a **READ-ONLY analysis** with NO code modifications.

**Target Files:**
- [api.php](file:///d:/cc.carnival.com.bd/agc/api.php) (5,652 lines) - External API for agent actions
- [vdc_db_query.php](file:///d:/cc.carnival.com.bd/agc/vdc_db_query.php) (22,462 lines) - Internal AJAX handler for agent interface
- [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php) (1,761 lines) - Polling endpoint for agent state

---

## TASK 1: api.php Agent-Related Endpoints

### Overview
[api.php](file:///d:/cc.carnival.com.bd/agc/api.php) is designed as an external API to allow other programs to interact with the VICIDIAL Agent screen. It requires authentication via `user` and `pass` parameters.

### Authentication Requirements

**Required Parameters (All Endpoints):**
- `user` - Agent username
- `pass` - Agent password  
- `source` - Source identifier (e.g., 'vtiger', 'webform', 'adminweb')
- `agent_user` - Target agent username (for most functions)
- `function` - API function name

**Authentication Checks:**
1. User must exist in `vicidial_users` with `vdc_agent_api_access='1'`
2. System setting `vdc_agent_api_active` must be '1'
3. User may have `api_list_restrict` and `api_allowed_functions` restrictions

### Agent-Related Endpoints

#### 1. `external_hangup`
**Purpose:** Hang up the active agent call  
**Agent Flow:** Hangup Flow (Section 3.4)

**Required Parameters:**
- `value` - Hangup type/reason
- `agent_user` OR `alt_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE status
- `vicidial_auto_calls` - UPDATE/DELETE call record
- `vicidial_manager` - INSERT Hangup command for Asterisk
- `vicidial_agent_log` - UPDATE talk time

**How It Works:**
1. Validates agent is logged in
2. Inserts Hangup command into `vicidial_manager`
3. Asterisk AMI processes hangup
4. Updates agent status to PAUSED or DISPO

**Can Be Proxied via Laravel:** YES
- Simple HTTP POST/GET
- Returns text response
- No session dependency

---

#### 2. `external_status`
**Purpose:** Set agent disposition/status  
**Agent Flow:** Disposition Flow (Section 3.5)

**Required Parameters:**
- `value` - Status code (e.g., 'SALE', 'NI', 'CB', 'DNC')
- `agent_user` - Target agent
- `lead_id` - (Optional) Lead ID
- `callback_datetime` - (Optional) Callback date/time
- `callback_type` - (Optional) 'USERONLY' or 'ANYONE'
- `callback_comments` - (Optional) Callback notes
- `qm_dispo_code` - (Optional) QueueMetrics disposition code

**DB Tables Touched:**
- `vicidial_list` - UPDATE status, comments
- `vicidial_callbacks` - INSERT callback if applicable
- `vicidial_campaign_dnc` OR `vicidial_dnc` - INSERT if status='DNC'
- `vicidial_live_agents` - UPDATE status, clear lead_id
- `vicidial_agent_log` - UPDATE dispo time
- `vicidial_log` OR `vicidial_closer_log` - UPDATE final status

**Can Be Proxied via Laravel:** YES
- Standard HTTP request
- No complex state management
- Returns success/error text

---

#### 3. `external_pause`
**Purpose:** Pause the agent  
**Agent Flow:** Inverse of Ready Flow (Section 3.2)

**Required Parameters:**
- `value` - Pause code (or 'PAUSE')
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE status='PAUSED', pause_code
- `vicidial_agent_log` - UPDATE pause_epoch, wait_sec

**Can Be Proxied via Laravel:** YES

---

#### 4. `pause_code`
**Purpose:** Set pause code for already paused agent  
**Agent Flow:** Pause state management

**Required Parameters:**
- `value` - Pause code
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE pause_code
- `vicidial_agent_log` - UPDATE sub_status

**Can Be Proxied via Laravel:** YES

---

#### 5. `external_dial`
**Purpose:** Initiate a manual dial  
**Agent Flow:** Manual Dial (part of Call Assignment Flow, Section 3.3)

**Required Parameters:**
- `phone_number` - Number to dial
- `agent_user` - Target agent
- `phone_code` - (Optional) Phone code/prefix
- `search` - (Optional) Search for lead by phone
- `preview` - (Optional) 'YES' for preview dial
- `focus` - (Optional) Focus on lead
- `vendor_id` - (Optional) Vendor lead code
- `dial_prefix` - (Optional) Dial prefix override
- `group_alias` - (Optional) Group alias for CID
- `alt_dial` - (Optional) 'MAIN', 'ALT', 'ADDR3' for alternate numbers
- `dial_ingroup` - (Optional) Dial as inbound group call
- `outbound_cid` - (Optional) Outbound caller ID

**DB Tables Touched:**
- `vicidial_list` - SELECT/INSERT lead
- `vicidial_auto_calls` - INSERT call record
- `vicidial_live_agents` - UPDATE lead_id, status
- `vicidial_manager` - INSERT Originate command
- `vicidial_hopper` - INSERT if manual dial queue enabled

**Can Be Proxied via Laravel:** YES
- But requires understanding of dial logic
- May need to replicate DNC checks
- Callback lookups

---

#### 6. `change_ingroups`
**Purpose:** Change agent's selected inbound groups  
**Agent Flow:** Agent configuration (not core flow)

**Required Parameters:**
- `value` - Comma-separated ingroup list
- `agent_user` - Target agent
- `set_as_default` - (Optional) 'YES' to save as default

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE closer_campaigns
- `vicidial_live_inbound_agents` - INSERT/UPDATE ingroup assignments
- `vicidial_inbound_group_agents` - UPDATE if set_as_default

**Can Be Proxied via Laravel:** YES

---

#### 7. `st_login_log`
**Purpose:** Get agent login log  
**Agent Flow:** Reporting (not core flow)

**Required Parameters:**
- `agent_user` OR `alt_user` - Target agent

**DB Tables Touched:**
- `vicidial_agent_log` - SELECT login history

**Can Be Proxied via Laravel:** YES

---

#### 8. `st_get_agent_active_lead`
**Purpose:** Get agent's current active lead  
**Agent Flow:** Lead information retrieval

**Required Parameters:**
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - SELECT lead_id
- `vicidial_list` - SELECT lead details

**Can Be Proxied via Laravel:** YES

---

#### 9. `update_fields`
**Purpose:** Update lead custom fields  
**Agent Flow:** Lead data modification

**Required Parameters:**
- `agent_user` - Target agent
- `lead_id` - Lead ID
- Custom field parameters (dynamic)

**DB Tables Touched:**
- `vicidial_list` - UPDATE lead fields
- `custom_[list_id]` - UPDATE custom table if exists

**Can Be Proxied via Laravel:** YES

---

#### 10. `ra_call_control`
**Purpose:** Real-time agent call control (resume/pause)  
**Agent Flow:** Ready/Pause toggle

**Required Parameters:**
- `value` - 'RESUME' or 'PAUSE'
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE status
- `vicidial_agent_log` - UPDATE pause/wait times
- `queue_log` - INSERT QueueMetrics PAUSE/UNPAUSE

**Can Be Proxied via Laravel:** YES

---

#### 11. `send_dtmf`
**Purpose:** Send DTMF tones during call  
**Agent Flow:** In-call action

**Required Parameters:**
- `value` - DTMF digits to send
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT PlayDTMF command

**Can Be Proxied via Laravel:** YES

---

#### 12. `transfer_conference`
**Purpose:** Transfer or conference call  
**Agent Flow:** Call transfer/3-way

**Required Parameters:**
- `value` - Transfer type ('BLIND', 'DIAL', 'PARK', etc.)
- `phone_number` - Transfer destination
- `agent_user` - Target agent
- `consultative` - (Optional) 'YES' for consultative transfer
- `dial_prefix` - (Optional) Dial prefix
- `group_alias` - (Optional) Group alias for CID
- `cid_choice` - (Optional) Caller ID choice
- `multi_dial_phones` - (Optional) Multiple phone numbers

**DB Tables Touched:**
- `vicidial_manager` - INSERT transfer/conference commands
- `vicidial_xfer_log` - INSERT transfer log
- `vicidial_live_agents` - UPDATE status if needed

**Can Be Proxied via Laravel:** YES (but complex)

---

#### 13. `park_call`
**Purpose:** Park the current call  
**Agent Flow:** Call parking

**Required Parameters:**
- `value` - Park type ('PARK', 'GRAB', 'PARK_XFER', 'GRAB_XFER')
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT Park command
- `vicidial_live_agents` - UPDATE status

**Can Be Proxied via Laravel:** YES

---

#### 14. `logout`
**Purpose:** Log out the agent  
**Agent Flow:** Logout (inverse of Login Flow, Section 3.1)

**Required Parameters:**
- `agent_user` - Target agent
- `value` - (Optional) Logout reason

**DB Tables Touched:**
- `vicidial_live_agents` - DELETE agent record
- `vicidial_agent_log` - UPDATE logout time
- `vicidial_user_log` - INSERT LOGOUT event
- `vicidial_manager` - INSERT Hangup commands

**Can Be Proxied via Laravel:** YES

---

#### 15. `external_add_lead`
**Purpose:** Add a new lead to the system  
**Agent Flow:** Lead creation (not core agent flow)

**Required Parameters:**
- `phone_number` - Lead phone number
- `phone_code` - Phone code
- `list_id` - Target list ID
- `first_name`, `last_name`, etc. - Lead details

**DB Tables Touched:**
- `vicidial_list` - INSERT new lead
- `vicidial_hopper` - INSERT if immediate dial

**Can Be Proxied via Laravel:** YES

---

#### 16. `recording`
**Purpose:** Start/stop/pause call recording  
**Agent Flow:** Recording control

**Required Parameters:**
- `value` - 'START', 'STOP', 'PAUSE', 'RESUME'
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT recording commands
- `recording_log` - INSERT/UPDATE recording metadata

**Can Be Proxied via Laravel:** YES

---

#### 17. `webphone_url`
**Purpose:** Get webphone URL for agent  
**Agent Flow:** Webphone initialization

**Required Parameters:**
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_users` - SELECT webphone settings
- `phones` - SELECT phone configuration

**Can Be Proxied via Laravel:** YES

---

#### 18. `call_agent`
**Purpose:** Initiate a call to an agent  
**Agent Flow:** Agent-to-agent call

**Required Parameters:**
- `value` - Target agent extension
- `agent_user` - Calling agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT Originate command

**Can Be Proxied via Laravel:** YES

---

#### 19. `audio_playback`
**Purpose:** Play audio file to agent  
**Agent Flow:** Audio playback

**Required Parameters:**
- `value` - Audio filename
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT Playback command

**Can Be Proxied via Laravel:** YES

---

#### 20. `switch_lead`
**Purpose:** Switch to a different lead  
**Agent Flow:** Lead switching

**Required Parameters:**
- `lead_id` - New lead ID
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE lead_id
- `vicidial_list` - SELECT new lead details

**Can Be Proxied via Laravel:** YES

---

#### 21. `calls_in_queue_count`
**Purpose:** Get count of calls in queue  
**Agent Flow:** Queue monitoring

**Required Parameters:**
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_auto_calls` - SELECT count
- `vicidial_live_chats` - SELECT count (if chats enabled)
- `vicidial_email_list` - SELECT count (if emails enabled)

**Can Be Proxied via Laravel:** YES

---

#### 22. `force_fronter_leave_3way`
**Purpose:** Force fronter to leave 3-way call  
**Agent Flow:** 3-way call management

**Required Parameters:**
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT Hangup command for fronter

**Can Be Proxied via Laravel:** YES

---

#### 23. `force_fronter_audio_stop`
**Purpose:** Stop fronter audio playback  
**Agent Flow:** Audio control

**Required Parameters:**
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT StopPlayback command

**Can Be Proxied via Laravel:** YES

---

#### 24. `vm_message`
**Purpose:** Leave voicemail message  
**Agent Flow:** Voicemail handling

**Required Parameters:**
- `value` - Voicemail action
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_manager` - INSERT voicemail commands

**Can Be Proxied via Laravel:** YES

---

#### 25. `send_notification`
**Purpose:** Send notification to agent  
**Agent Flow:** Agent notifications

**Required Parameters:**
- `recipient` - Target agent
- `notification_text` - Message text
- `notification_date` - (Optional) Scheduled date
- `duration` - (Optional) Display duration
- `show_confetti` - (Optional) Show confetti animation

**DB Tables Touched:**
- `vicidial_agent_notifications` - INSERT notification

**Can Be Proxied via Laravel:** YES

---

#### 26. `refresh_panel`
**Purpose:** Refresh agent screen panel  
**Agent Flow:** UI refresh trigger

**Required Parameters:**
- `value` - Panel to refresh
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE comments field with refresh trigger

**Can Be Proxied via Laravel:** YES

---

#### 27. `preview_dial_action`
**Purpose:** Control preview dial behavior  
**Agent Flow:** Preview dial management

**Required Parameters:**
- `value` - Action ('SKIP', 'DIALONLY', 'ALTDIAL', 'ADDRESS3')
- `agent_user` - Target agent

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE preview_lead_id
- `vicidial_hopper` - UPDATE/DELETE hopper entry

**Can Be Proxied via Laravel:** YES

---

### api.php Summary

**Total Agent Endpoints:** 27+  
**All Can Be Proxied via Laravel:** YES  
**Authentication:** Required for all  
**Response Format:** Text (pipe-delimited or newline-separated)

---

## TASK 2: vdc_db_query.php ACTION Values

### Overview
[vdc_db_query.php](file:///d:/cc.carnival.com.bd/agc/vdc_db_query.php) is the **internal AJAX handler** used by [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) agent interface. It processes real-time agent actions via JavaScript AJAX calls.

**Note:** This file is 22,462 lines and contains hundreds of ACTION values. Based on file headers and structure analysis, here are the key agent-related actions:

### Core Agent Actions

#### 1. `manDiaLnextCaLL`
**Purpose:** Manual dial next call / submit disposition  
**Agent Flow:** Disposition Flow (Section 3.5) + Manual Dial

**Parameters:**
- `lead_id` - Lead ID
- `status` - Disposition status
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `CallBackDatETimE` - (Optional) Callback datetime
- `CallBackCommenTs` - (Optional) Callback comments
- `DiaL_QueuE_CoDE` - (Optional) Manual dial queue code
- `MDDiaLCodE` - (Optional) Manual dial code

**DB Tables Touched:**
- `vicidial_list` - UPDATE status
- `vicidial_callbacks` - INSERT if callback
- `vicidial_hopper` - DELETE current, INSERT next if auto-dial
- `vicidial_live_agents` - UPDATE status, lead_id
- `vicidial_agent_log` - UPDATE dispo time
- `vicidial_log` OR `vicidial_closer_log` - INSERT/UPDATE call log

**Corresponding Agent Flow:** Disposition Flow (3.5)

---

#### 2. `VDADpause`
**Purpose:** Pause agent (auto-dial)  
**Agent Flow:** Pause (inverse of Ready Flow, Section 3.2)

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `conf_exten` - Conference extension
- `ext_context` - Extension context
- `qm_extension` - QueueMetrics extension

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE status='PAUSED'
- `vicidial_agent_log` - UPDATE pause_epoch

**Corresponding Agent Flow:** Pause state

---

#### 3. `VDADready`
**Purpose:** Set agent to READY (auto-dial)  
**Agent Flow:** Ready Flow (Section 3.2)

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `conf_exten` - Conference extension

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE status='READY', pause_code=''
- `vicidial_agent_log` - UPDATE pause_sec, wait_epoch

**Corresponding Agent Flow:** Ready Flow (3.2)

---

#### 4. `VDADREADYhangup`
**Purpose:** Hangup and go to READY  
**Agent Flow:** Hangup Flow (Section 3.4) + Auto-Ready

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `conf_exten` - Conference extension
- `channel` - Agent channel

**DB Tables Touched:**
- `vicidial_manager` - INSERT Hangup command
- `vicidial_live_agents` - UPDATE status='READY'
- `vicidial_auto_calls` - UPDATE/DELETE

**Corresponding Agent Flow:** Hangup Flow (3.4)

---

#### 5. `VDADREADYhangup_3way`
**Purpose:** Hangup 3-way call and go READY  
**Agent Flow:** 3-way hangup + Ready

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `conf_exten` - Conference extension
- `channel` - Agent channel
- `xferchannel` - Transfer channel

**DB Tables Touched:**
- `vicidial_manager` - INSERT Hangup commands
- `vicidial_live_agents` - UPDATE status='READY'
- `vicidial_xfer_log` - INSERT transfer log

**Corresponding Agent Flow:** Hangup Flow (3.4)

---

#### 6. `PauseCodeSelect`
**Purpose:** Select pause code  
**Agent Flow:** Pause with code

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `pause_code` - Selected pause code

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE pause_code
- `vicidial_agent_log` - UPDATE sub_status

**Corresponding Agent Flow:** Pause state management

---

#### 7. `UnPauseCode`
**Purpose:** Unpause agent (resume)  
**Agent Flow:** Ready Flow (Section 3.2)

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE status='READY', pause_code=''
- `vicidial_agent_log` - UPDATE pause_sec, wait_epoch

**Corresponding Agent Flow:** Ready Flow (3.2)

---

#### 8. `regCLOSER`
**Purpose:** Register closer/inbound call  
**Agent Flow:** Call Assignment Flow (Section 3.3) - Inbound

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `conf_exten` - Conference extension
- `phone_number` - Customer phone
- `uniqueid` - Call unique ID
- `lead_id` - Lead ID
- `list_id` - List ID
- `closecallid` - Closer call ID
- `xfercallid` - Transfer call ID

**DB Tables Touched:**
- `vicidial_live_agents` - UPDATE status='INCALL', lead_id, uniqueid
- `vicidial_auto_calls` - INSERT/UPDATE call record
- `vicidial_list` - UPDATE status='INCALL'
- `vicidial_agent_log` - UPDATE talk_epoch
- `vicidial_closer_log` - INSERT call log

**Corresponding Agent Flow:** Call Assignment Flow (3.3)

---

#### 9. `updateDISPO`
**Purpose:** Update disposition  
**Agent Flow:** Disposition Flow (Section 3.5)

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `lead_id` - Lead ID
- `status` - Disposition status
- `uniqueid` - Call unique ID

**DB Tables Touched:**
- `vicidial_list` - UPDATE status
- `vicidial_log` OR `vicidial_closer_log` - UPDATE status
- `vicidial_agent_log` - UPDATE sub_status

**Corresponding Agent Flow:** Disposition Flow (3.5)

---

#### 10. `CALLSINQUEUEgrab`
**Purpose:** Grab call from queue  
**Agent Flow:** Manual call grab

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `server_ip` - Server IP
- `call_server_ip` - Call server IP
- `uniqueid` - Call unique ID

**DB Tables Touched:**
- `vicidial_auto_calls` - UPDATE agent assignment
- `vicidial_live_agents` - UPDATE lead_id, uniqueid, status='INCALL'
- `vicidial_manager` - INSERT Redirect command

**Corresponding Agent Flow:** Call Assignment Flow (3.3)

---

#### 11. `CalLBacKLisT`
**Purpose:** Get callback list for agent  
**Agent Flow:** Callback management

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID

**DB Tables Touched:**
- `vicidial_callbacks` - SELECT callbacks for agent

**Corresponding Agent Flow:** Lead selection

---

#### 12. `CalLBacKCounT`
**Purpose:** Get callback count for agent  
**Agent Flow:** Callback monitoring

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID

**DB Tables Touched:**
- `vicidial_callbacks` - SELECT count

**Corresponding Agent Flow:** UI display

---

#### 13. `LogiNCamPaigns`
**Purpose:** Get available campaigns for login  
**Agent Flow:** Login Flow (Section 3.1)

**Parameters:**
- `user` - Agent username
- `pass` - Agent password

**DB Tables Touched:**
- `vicidial_users` - SELECT user permissions
- `vicidial_campaigns` - SELECT allowed campaigns
- `vicidial_campaign_agents` - SELECT agent-campaign associations

**Corresponding Agent Flow:** Login Flow (3.1)

---

#### 14. `LEADINFOview`
**Purpose:** View lead information  
**Agent Flow:** Lead data display

**Parameters:**
- `lead_id` - Lead ID
- `user` - Agent username
- `pass` - Agent password

**DB Tables Touched:**
- `vicidial_list` - SELECT lead details
- `custom_[list_id]` - SELECT custom fields

**Corresponding Agent Flow:** In-call display

---

#### 15. `AGENTSview`
**Purpose:** View available agents for transfer  
**Agent Flow:** Transfer agent selection

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID

**DB Tables Touched:**
- `vicidial_live_agents` - SELECT agents

**Corresponding Agent Flow:** Transfer/conference

---

#### 16. `customer_3way_hangup_process`
**Purpose:** Process customer hangup in 3-way  
**Agent Flow:** 3-way call management

**Parameters:**
- `user` - Agent username
- `pass` - Agent password
- `campaign` - Campaign ID
- `conf_exten` - Conference extension

**DB Tables Touched:**
- `vicidial_auto_calls` - UPDATE/DELETE
- `vicidial_live_agents` - UPDATE status
- `vicidial_manager` - INSERT Hangup commands

**Corresponding Agent Flow:** Hangup Flow (3.4)

---

### vdc_db_query.php Summary

**Total ACTION Values:** 100+ (estimated)  
**Agent-Related Actions:** 50+ (estimated)  
**Authentication:** Required (user/pass)  
**Response Format:** Text (pipe-delimited)  
**Primary Use:** Internal AJAX from vicidial.php

**Key Observations:**
- This is the **primary action handler** for the agent interface
- Most agent flows (Ready, Pause, Hangup, Disposition) go through this file
- NOT designed as external API (unlike api.php)
- Tightly coupled with vicidial.php JavaScript

---

## TASK 3: conf_exten_check.php Polling Endpoint

### Overview
[conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php) is the **polling endpoint** that the agent interface calls every 1-2 seconds to maintain state synchronization.

**File Size:** 1,761 lines  
**Primary ACTION:** `refresh` (default)

### Input Parameters

**Required:**
- `server_ip` - Agent's server IP
- `session_name` - PHP session ID
- `user` - Agent username
- `pass` - Agent password

**Optional:**
- `format` - 'text' or 'debug'
- `ACTION` - 'refresh' or 'register'
- `client` - 'agc' or 'vdc'
- `conf_exten` - Conference extension
- `exten` - Agent extension
- `auto_dial_level` - Auto-dial level
- `campagentstdisp` - 'YES' to display campaign stats
- `clicks` - Agent click tracking data
- `customer_chat_id` - Chat ID if in chat
- `live_call_seconds` - Current call duration
- `xferchannel` - Transfer channel
- `check_for_answer` - Check if call answered
- `MDnextCID` - Manual dial next CID
- `campaign` - Campaign ID
- `phone_number` - Phone number
- `visibility` - Page visibility status
- `active_ingroup_dial` - Active ingroup dial
- `latency` - Client latency
- `dead_count` - Dead call counter

### Response Format

**Text Response (Pipe-Delimited):**

The response is a complex pipe-delimited string containing:

1. **Agent Status:**
   - Current status from `vicidial_live_agents`
   - Status changes (READY → INCALL, etc.)

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
   - Calls in queue count (HTML formatted)
   - Email/chat counts if enabled

5. **Time Sync:**
   - Server time
   - Database time
   - Time synchronization check

6. **Notifications:**
   - Agent notifications
   - System messages

**Example Response Structure:**
```
STATUS|READY|LEAD_ID|12345|UNIQUEID|1234567890.123|CALLERID|5551234567|CALLS_IN_QUEUE|<font class="queue_text">Calls in Queue: 5</font>|SERVER_TIME|2024-01-01 12:00:00|...
```

### DB Tables Read

1. **`vicidial_live_agents`:**
   ```sql
   SELECT status, callerid, agent_log_id, campaign_id, lead_id, comments
   FROM vicidial_live_agents
   WHERE user='$user' AND server_ip='$server_ip'
   ```

2. **`vicidial_session_data`:**
   ```sql
   SELECT count(*)
   FROM vicidial_session_data
   WHERE user='$user' AND server_ip='$server_ip' AND session_name='$session_name'
   ```

3. **`vicidial_campaigns`:**
   ```sql
   SELECT api_manual_dial, calls_inqueue_count_one, calls_inqueue_count_two
   FROM vicidial_campaigns
   WHERE campaign_id='$campaign_id'
   ```

4. **`vicidial_auto_calls`:**
   ```sql
   SELECT count(*)
   FROM vicidial_auto_calls
   WHERE status IN('LIVE') AND campaign_id='$campaign'
   ```

5. **`vicidial_live_chats`:**
   ```sql
   SELECT count(*)
   FROM vicidial_live_chats
   WHERE status='WAITING' AND group_id IN('$ingroups')
   ```

6. **`vicidial_email_list`:**
   ```sql
   SELECT count(*)
   FROM vicidial_email_list
   WHERE status='QUEUE' AND group_id IN('$ingroups')
   ```

7. **`vicidial_agent_notifications`:**
   ```sql
   SELECT notification_id, message, urgency
   FROM vicidial_agent_notifications
   WHERE user='$user' AND acknowledged='N'
   ```

8. **`vicidial_settings_containers`:**
   - For calls_inqueue_count calculations

### Can This Be Proxied via Laravel?

**Answer: YES, BUT WITH SIGNIFICANT COMPLEXITY**

**Pros:**
- Standard HTTP GET/POST request
- Text response format
- No binary data
- Stateless (uses session_name for validation)

**Cons:**
1. **High Frequency:** Called every 1-2 seconds per agent
   - 100 agents = 100 requests/second
   - Laravel overhead may add latency
   - Database connection pooling critical

2. **Complex Response Logic:**
   - Multiple conditional queries
   - HTML formatting in response
   - Settings container parsing
   - Time synchronization checks

3. **Performance Critical:**
   - Any delay affects agent experience
   - Must complete in <500ms
   - Database query optimization essential

4. **State Validation:**
   - Checks `web_client_sessions` table
   - Validates session_name + server_ip
   - Laravel session management different

**Recommended Approach for Laravel Proxy:**

1. **Direct Proxy (Simple):**
   - Laravel route → forward to VICIDIAL conf_exten_check.php
   - Add authentication layer
   - Log requests
   - **Pros:** Minimal changes
   - **Cons:** No Laravel benefits

2. **Reimplementation (Complex):**
   - Rewrite logic in Laravel controller
   - Use Laravel Eloquent for queries
   - Cache frequently accessed data (campaigns, settings)
   - Use Redis for session validation
   - **Pros:** Full Laravel integration, better performance potential
   - **Cons:** High development effort, must maintain parity

3. **Hybrid (Recommended):**
   - Laravel handles authentication/authorization
   - Cache static data (campaigns, settings) in Redis
   - Forward dynamic queries to VICIDIAL
   - Transform response if needed
   - **Pros:** Balance of integration and effort
   - **Cons:** More complex architecture

**Critical Considerations:**
- **Latency:** Must be <500ms total
- **Caching:** Aggressive caching of static data
- **Connection Pooling:** Reuse database connections
- **Error Handling:** Graceful degradation if VICIDIAL unavailable
- **Monitoring:** Track response times, error rates

---

## TASK 4: Gap Analysis

### Agent Actions NOT Fully Covered by APIs

| Agent Action | VICIDIAL Component | Why Not Proxied | Workaround |
|--------------|-------------------|-----------------|------------|
| **Initial Login** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) form submission | Renders full HTML interface, not API | **GAP:** Must use vicidial.php directly OR build custom login UI that calls vdc_db_query.php actions |
| **JavaScript State Management** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) embedded JavaScript | Client-side state, timers, UI updates | **GAP:** Must replicate JavaScript logic in new frontend OR use vicidial.php as-is |
| **Real-time Call Bridging** | Asterisk dialplan + AGI scripts | Happens in Asterisk, not HTTP | **NOT A GAP:** Asterisk handles this, APIs trigger via `vicidial_manager` |
| **Auto-Dial Call Assignment** | `AST_VDauto_dial.pl` daemon | Background Perl process monitors DB | **NOT A GAP:** Daemon independent of HTTP layer |
| **Callback Scheduling** | Callback daemon | Background process | **NOT A GAP:** APIs can INSERT callbacks, daemon processes them |
| **Lead Hopper Management** | Hopper loader daemon | Background process | **NOT A GAP:** APIs can INSERT/DELETE hopper entries |
| **Recording File Management** | Asterisk + file system | Recording files stored on server | **PARTIAL GAP:** APIs can start/stop recording, but file retrieval needs separate mechanism |
| **Screen Pop / CRM Integration** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side URL opening | **GAP:** Must replicate in new frontend |
| **Hotkey Handling** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side keyboard events | **GAP:** Must replicate in new frontend |
| **Timer Display** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side timers | **GAP:** Must replicate in new frontend |
| **Multi-Tab Coordination** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side localStorage/BroadcastChannel | **GAP:** Must replicate in new frontend |
| **WebRTC/Webphone** | Separate webphone interface | WebRTC signaling | **PARTIAL GAP:** `webphone_url` API exists, but integration complex |
| **Chat Interface** | Separate chat interface | Real-time messaging | **PARTIAL GAP:** Chat status in polling, but full chat UI separate |
| **Email Interface** | Separate email interface | Email handling | **PARTIAL GAP:** Email count in polling, but full email UI separate |
| **Form/Script Display** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) iframes | Dynamic HTML rendering | **GAP:** Must replicate form rendering logic |
| **Custom Fields Display** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) dynamic HTML | Database-driven field generation | **GAP:** Must query custom table structure and render |
| **Transfer Conference UI** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Complex UI state management | **GAP:** Must replicate transfer UI logic |
| **Disposition Selection UI** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Dynamic status list rendering | **PARTIAL GAP:** Can get statuses via query, but UI rendering needed |
| **Lead Search** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript + AJAX | Search UI and results display | **PARTIAL GAP:** Can search via custom query, but UI needed |
| **Call Notes** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) textarea | Simple, but integrated with dispo | **PARTIAL GAP:** Can submit via `external_status`, but UI needed |
| **Shift Enforcement** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) + conf_exten_check.php | Login-time and polling checks | **NOT A GAP:** Enforced server-side |
| **Timeclock Integration** | Separate timeclock.php | Separate interface | **NOT A GAP:** Independent system |
| **Manager Override** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) special parameter | Login-time check | **PARTIAL GAP:** Can pass parameter, but UI needed |
| **Two-Factor Auth** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) multi-step flow | Complex state machine | **GAP:** Must replicate 2FA flow |
| **Password Change** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) form | Login-time enforcement | **GAP:** Must replicate password change UI |
| **Campaign Selection** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) dropdown | Login-time selection | **PARTIAL GAP:** `LogiNCamPaigns` ACTION exists, but UI needed |
| **Dial Prefix Override** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) input | Login-time or per-call | **PARTIAL GAP:** APIs support dial_prefix, but UI needed |
| **Group Alias Selection** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) dropdown | Per-call selection | **PARTIAL GAP:** APIs support group_alias, but UI needed |
| **Closer Blended Toggle** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) checkbox | Login-time selection | **GAP:** Must replicate UI |
| **Preview Dial Controls** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) buttons | Preview mode UI | **PARTIAL GAP:** `preview_dial_action` API exists, but UI needed |
| **Alt Phone Dialing** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) buttons | Alternate number selection | **PARTIAL GAP:** `external_dial` supports alt_dial, but UI needed |
| **Manual Dial Filter** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | DNC/list filtering | **PARTIAL GAP:** Filtering happens server-side, but UI feedback needed |
| **Dead Call Detection** | [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php) + JavaScript | Client reports, server validates | **NOT A GAP:** Polling handles this |
| **Customer Hangup Detection** | [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php) + JavaScript | Polling detects, UI alerts | **NOT A GAP:** Polling handles this |
| **Queue Position Display** | [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php) | Polling provides data | **NOT A GAP:** Data available, UI rendering needed |
| **Agent Status Display** | [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php) | Polling provides data | **NOT A GAP:** Data available, UI rendering needed |
| **Call Timer Display** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side timer | **GAP:** Must replicate in new frontend |
| **Pause Timer Display** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side timer | **GAP:** Must replicate in new frontend |
| **Wrapup Timer** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side countdown | **GAP:** Must replicate in new frontend |
| **Auto-Ready After Wrapup** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Client-side timer triggers action | **GAP:** Must replicate in new frontend |
| **Scheduled Callbacks Display** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) + vdc_db_query.php | Callback list rendering | **PARTIAL GAP:** `CalLBacKLisT` ACTION exists, but UI needed |
| **Lead History Display** | [vicidial.php](file:///d:/cc.carnival.com.bd/agc/vicidial.php) JavaScript | Call history rendering | **GAP:** Must query and render history |
| **Recording Playback** | Separate interface | Audio player | **GAP:** Must build audio player UI |
| **QueueMetrics Integration** | vdc_db_query.php logging | `queue_log` table writes | **NOT A GAP:** Happens server-side |
| **Custom Reporting** | Separate reports | Report generation | **NOT A GAP:** Independent system |

### Summary of Gaps

**CRITICAL GAPS (Cannot be proxied):**
1. **Initial Login UI** - Must use vicidial.php OR build custom
2. **JavaScript State Management** - Must replicate in new frontend
3. **Client-Side Timers** - Must replicate in new frontend
4. **Hotkey Handling** - Must replicate in new frontend
5. **Form/Script Rendering** - Must replicate dynamic HTML generation
6. **Two-Factor Auth Flow** - Must replicate multi-step process

**PARTIAL GAPS (API exists, but UI needed):**
1. **Disposition Selection** - API: `external_status`, UI: dropdown
2. **Transfer/Conference** - API: `transfer_conference`, UI: complex controls
3. **Lead Search** - API: custom query, UI: search interface
4. **Campaign Selection** - API: `LogiNCamPaigns`, UI: dropdown
5. **Callback Management** - API: `CalLBacKLisT`, UI: list display
6. **Preview Dial** - API: `preview_dial_action`, UI: buttons
7. **Alt Phone Dialing** - API: `external_dial` with alt_dial, UI: buttons

**NOT GAPS (Fully handled server-side or via existing APIs):**
1. **Auto-Dial Assignment** - Background daemon
2. **Call Bridging** - Asterisk
3. **Recording Start/Stop** - API: `recording`
4. **Pause/Ready** - API: `external_pause`, `ra_call_control`
5. **Hangup** - API: `external_hangup`
6. **Dead Call Detection** - Polling: [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php)
7. **Queue Monitoring** - Polling: [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php)

---

## Recommendations for Laravel Integration

### Option 1: Minimal Integration (Recommended for MVP)
**Approach:** Use existing VICIDIAL interfaces, add Laravel authentication layer

**Architecture:**
```
User → Laravel (Auth) → VICIDIAL vicidial.php (Agent UI)
                      → VICIDIAL api.php (External actions)
                      → VICIDIAL conf_exten_check.php (Polling)
```

**Pros:**
- Minimal development effort
- No risk of breaking existing functionality
- Laravel handles user management, permissions
- Can add custom reporting, dashboards

**Cons:**
- Still using legacy VICIDIAL UI
- Limited customization
- Two separate systems

---

### Option 2: API-First Integration
**Approach:** Build new Laravel frontend, use VICIDIAL APIs

**Architecture:**
```
User → Laravel Frontend (Vue/React) → Laravel Backend API
                                    → VICIDIAL api.php (Agent actions)
                                    → VICIDIAL vdc_db_query.php (Internal actions)
                                    → VICIDIAL conf_exten_check.php (Polling)
```

**Required Development:**
1. **Login Flow:** Custom UI → `LogiNCamPaigns` ACTION
2. **Agent Interface:** Vue/React SPA with:
   - Status controls (Ready/Pause) → `ra_call_control` API
   - Dial controls → `external_dial` API
   - Hangup → `external_hangup` API
   - Disposition → `external_status` API
   - Lead display → `st_get_agent_active_lead` API
   - Polling → [conf_exten_check.php](file:///d:/cc.carnival.com.bd/agc/conf_exten_check.php) (every 1s)
3. **State Management:** Vuex/Redux to mirror VICIDIAL state
4. **Timers:** JavaScript timers for call/pause/wrapup
5. **Hotkeys:** JavaScript keyboard event handlers

**Pros:**
- Modern UI/UX
- Full customization
- Better mobile support
- Easier to extend

**Cons:**
- High development effort
- Must maintain parity with VICIDIAL features
- Risk of bugs/missing functionality
- Performance optimization critical

---

### Option 3: Hybrid Approach (Recommended for Long-Term)
**Approach:** Gradually migrate features to Laravel

**Phase 1:** Authentication + Reporting
- Laravel handles login, user management
- VICIDIAL handles agent interface
- Laravel builds custom reports

**Phase 2:** API Layer
- Laravel middleware for all VICIDIAL API calls
- Add logging, monitoring, rate limiting
- Cache frequently accessed data

**Phase 3:** Custom Agent UI (Optional)
- Build new agent interface for specific use cases
- Keep VICIDIAL UI as fallback
- Migrate features incrementally

**Pros:**
- Incremental migration reduces risk
- Can prove value at each phase
- Flexibility to stop at any phase

**Cons:**
- Longer timeline
- Maintaining two systems during transition
- Complexity of hybrid architecture

---

## Conclusion

### Key Findings:

1. **api.php provides 27+ agent-related endpoints** - All can be proxied via Laravel
2. **vdc_db_query.php has 50+ agent actions** - Internal AJAX handler, tightly coupled with vicidial.php
3. **conf_exten_check.php is the polling endpoint** - Can be proxied, but performance critical
4. **Significant gaps exist in UI/UX layer** - JavaScript state management, timers, hotkeys, form rendering

### Can Agent Flows Be Fully Replicated via APIs?

**Answer: YES, BUT...**

- **Core flows (Login, Ready, Pause, Dial, Hangup, Disposition):** Fully supported via APIs
- **UI/UX features (timers, hotkeys, forms, scripts):** Must be rebuilt in new frontend
- **Real-time features (polling, state sync):** Supported, but performance optimization critical
- **Background processes (auto-dial, callbacks, hopper):** Independent of HTTP layer, no changes needed

### Recommended Path Forward:

1. **Start with Option 1 (Minimal Integration)** for immediate Laravel benefits
2. **Build API middleware layer** to add logging, monitoring, caching
3. **Gradually migrate to Option 3 (Hybrid)** as requirements evolve
4. **Only pursue Option 2 (Full Rewrite)** if complete UI overhaul is required

### Critical Success Factors:

- **Performance:** Polling must remain <500ms
- **Reliability:** No downtime during migration
- **Feature Parity:** Don't lose existing functionality
- **Testing:** Extensive testing of each migrated feature
- **Monitoring:** Track API usage, errors, performance

---

## Document Status

✅ TASK 1: api.php Endpoints - COMPLETE  
✅ TASK 2: vdc_db_query.php Actions - COMPLETE  
✅ TASK 3: conf_exten_check.php Analysis - COMPLETE  
✅ TASK 4: Gap Analysis - COMPLETE  

**Note:** This analysis is based on file structure, headers, and partial code review. Actual implementation details may vary. Recommend thorough testing of each API endpoint before production use.
