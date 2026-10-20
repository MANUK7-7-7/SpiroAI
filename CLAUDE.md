# SpiroAI working notes

## Keep the flowchart in sync (standing instruction from the owner)

Whenever a code change is significant for the product flow (a screen, route, step, decision, role or integration is added, removed, renamed or rewired), update the FigJam flowchart in the same piece of work, without asking first. Cosmetic or internal-only changes (styling, refactors, tests, copy tweaks) do not need it.

- Board: https://www.figma.com/board/Diyp4gqhyu2NucjPEk7JXZ (fileKey `Diyp4gqhyu2NucjPEk7JXZ`)
- Two diagrams, both in English and both starting at the landing page:
  - "SpiroAI · Full site flow": 8 ordered sections (Landing, Sign up and log in, Workspace home, Patients, Result review, Alerts actions and plan, Recording and analysis, Settings). Repeated blocks are duplicated per section instead of long back-edges.
  - "SpiroAI · Simplified site flow": about 17 steps in one line.
- Use plain names, never screen codes (no S01, S09...).
- Colour coding, identical in both diagrams, for blocks that repeat:
  - WhatsApp: green `#CDF4D3` / `#66D575`
  - Test result: blue `#C2E5FF` / `#3DADFF`
  - Alerts center: light red `#FFCDC2` / `#FF7556`
  - Audit log: grey `#D9D9D9` / `#B3B3B3`
  - Invite link: orange `#FFE0C2` / `#FF9E42`
  - Log in: yellow `#FFECBD` / `#FFC943`
  - Quality gate, AI model, alert rules: violet `#DCCCFF` / `#874FFF`
  - Dashboard: teal `#C6FAF6` / `#5AD8CC`
  - PDF report: pink `#FFC2EC` / `#F849C1`
- Prefer editing the existing nodes with `use_figma` for small changes (rename, recolour). For structural changes, clear the board and regenerate both diagrams with `generate_diagram`, keeping the order, colours and naming above.

## Conventions

- UI copy has no em dashes and no emoji. Risk is never shown by colour alone.
- Patients never see a risk score. Patient contact happens on WhatsApp, not in-app messaging.
- Thresholds, ranges and monitoring frequencies are sample values that need clinical validation; label them as such.
