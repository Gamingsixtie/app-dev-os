# Voice Profile (App Microcopy)

> Foundation file for **in-app text**: error messages, button labels, empty states, onboarding flows, confirmation dialogs. Skills load this when writing UI-copy.
>
> This is NOT for marketing-copy (landing pages, ads). For pure marketing voice, use Agentic OS.

## Tone

- **Register**: friendly-professional. Neutral middle ground — works for both casual personal apps and professional/educational contexts (e.g. Cito) without leaning hard either way.
- **Personality**: no-nonsense tool. Helpful, but prioritizes getting the user back on task over being charming.
- **Energy**: quick-and-punchy. Short sentences. UI-copy lives in tight spaces and tight copy reads faster.
- **Core rule**: shortest version that keeps the meaning unambiguous. Cut words aggressively; keep a word the moment cutting it makes the message harder to understand.

## Vocabulary

### Words we use
- "your", "you", "save", "delete", "try again", "check", "fix"
- direct verbs over hedged phrasing ("save" not "store your changes")

### Words we avoid
- "kindly", "please be advised", "an error has occurred"
- "unfortunately", "we apologize", "we regret"
- corporate filler: "regarding", "in order to", "as per"
- excessive cuteness: "oopsie", "whoops!", emoji-as-message

### Project-specific terms
- _Filled per app in `apps/{slug}/brand_context/voice-profile.md`._

## Sentence patterns

- **Length**: short. UI-copy lives in tight spaces.
- **Active voice**: yes. "Save your work" not "Your work has been saved."
- **Second-person**: yes ("you", "your"). Never "the user".
- **Contractions**: yes ("you're" not "you are").

## Error-message style

| ❌ Don't | ✅ Do |
|---|---|
| "An unexpected error has occurred." | "Something went wrong. Try again or [contact us]." |
| "Invalid input." | "Email needs an @ sign." |
| "Forbidden." | "You don't have access to this. Ask your admin." |

**Three rules**:
1. Say what happened
2. Say what to do next
3. Say it in 1-2 sentences

## Empty states

- **Tone**: encouraging, not apologetic
- **Show next action**: "Add your first project" + button
- **Avoid**: "There are no items to display."

## Onboarding flow

- Use first-person from the user's perspective sometimes ("My setup")
- Each step has a clear single action
- Always allow skip

## Sample microcopy

- _Save button_: "Save"
- _Empty inbox_: "No new messages."
- _Loading_: "Loading…"
- _Confirmation modal_: "Delete this project? This can't be undone."
- _Success toast_: "Saved."

## Per-app override

For apps where this default voice misfits — e.g. a very playful consumer app, or a strict regulated context — override under `apps/{slug}/brand_context/voice-profile.md`. The override fully replaces this file for that app. No merging.

---

*Built once via `/start-here` or `mkt-brand-voice` skill (which is kept for app-microcopy). Edit when product personality shifts.*
