# HUD Expectations for Playlab Games

This document defines the expected HUD quality bar for every game in this repo.

## Core Goal

The HUD must improve decision speed and keep attention on gameplay, not on UI chrome.

## Priority Order (Always)

1. **Objective now** (what to do in this moment)
2. **Danger/urgency** (time/lives pressure)
3. **Outcome feedback** (success/fail cue)
4. **Progress context** (score/level/best)
5. **Controls** (restart/settings)

If space is tight, lower-priority items must compress or hide first.

## Universal HUD Rules

- Keep top HUD compact and single-row whenever possible.
- Show only high-signal chips during active play:
  - Score
  - Lives
- De-emphasize best/history data during active rounds.
- Keep one dominant objective area per game.
- Avoid duplicate instruction channels (target card + verbose status at the same time).
- Keep status copy short and event-based:
  - "Great!"
  - "Oops!"
  - "Time's up!"
- Use one consistent restart pattern:
  - Header restart icon/button
  - Large in-play-area restart CTA on game-over overlay

## Timer Expectations

- Use one primary timer bar style across games.
- Only show numeric countdown when urgency is high (e.g., final 3 seconds).
- Timer color/behavior should escalate urgency predictably.

## End State Expectations

- Every game-over state should show a centered overlay card in player area.
- Card must include:
  - Clear game-over title
  - Key result (score/level)
  - Large primary restart CTA
- Optional: best-score note if it helps motivation.

## Accessibility Expectations

- Restart controls must have clear labels (`aria-label`).
- Avoid relying only on color for outcome state.
- Maintain readable text sizes on small screens.
- Preserve large tap targets for mobile.

## Acceptance Checklist (Per Game)

- [ ] Top HUD does not dominate vertical space.
- [ ] Objective is visually primary.
- [ ] No redundant instructional text during active rounds.
- [ ] Status messages are concise and contextual.
- [ ] Best/history info is de-emphasized during active play.
- [ ] Restart is available in header and large on game-over overlay.
- [ ] HUD remains clear on small phones and short-height screens.
