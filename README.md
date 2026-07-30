# Hourly Production Monitoring Dashboard
**CITIC Dicastal — SW CNC Production Line**

Live app: https://dicastal-hourly.netlify.app

Manager Dashboard: https://dicastal-hourly.netlify.app/dashboard

---

## 1. Purpose

This tool digitizes and automates hourly production tracking on the SW CNC line, replacing manual paper shift logs with a live, shared, web-based system. It gives operators a fast way to record hourly output per machine, and gives supervisors and management a real-time, visual view of line performance (OEE, efficiency, actual vs. target) without waiting for end-of-shift reports.

## 2. Problem It Solves

- Paper-based hourly logs are slow to fill in, easy to lose, and only visible after the fact.
- Machine performance issues (a machine falling behind target) are often noticed hours late.
- Comparing output across 21 machines and 4 shifts by hand is time-consuming and error-prone.
- Management has no live visibility into the floor without physically walking it or waiting for shift-end summaries.

## 3. What the App Does

### Data Entry (operator/team leader view)
- Select **date**, **shift** (A/B/C/D), and **hour block**.
- Log actual production per machine against target, across all 21 machines (MSA01–MSA21).
- Add machine rows as needed; save, load, and clear entries per shift.
- Password-protected data clearing to prevent accidental loss of shift records.
- Shift log view to review what has been entered for a given shift/date.

### Manager Dashboard (live view)
- Real-time clock and auto-refreshing data (updates every second) — always current, no manual refresh needed.
- **OEE / Efficiency %** headline figure for the line.
- **Machine Status** grid — at-a-glance which machines are on target vs. off target (color-coded).
- **Actual vs. Target** chart across all machines.
- **Efficiency % by machine** chart.
- **Cumulative production trend** over the shift.
- **Top 5 machines by output** ranking.
- Installable as a PWA (Progressive Web App) — can be added to a phone/tablet home screen and used like a native app, including on iPhone/iPad.

## 4. How It Works (Technical Overview)

- **Frontend:** Vanilla JavaScript, HTML, CSS (no framework overhead) — split into separate, maintainable files rather than one monolithic page.
- **Charts:** Chart.js for all live visualizations.
- **Backend / Data:** Firebase (project `factory-monitor-70095`) — real-time database so data entered on one device appears instantly on the manager dashboard on another.
- **Design:** Dark industrial HUD-style interface (glassmorphism panels, cyan/green/red status colors, monospace + technical fonts) designed to be readable at a glance on the shop floor and in the office.
- **Hosting:** Deployed via Netlify, accessible from any browser — desktop, tablet, or phone — no installation required (with optional PWA install for quick access).

## 5. Scope

- Coverage: 21 SW CNC machines (MSA01–MSA21).
- Shifts: A, B, C, D.
- Data granularity: hourly, per machine, per shift.

## 6. Benefits to the Line

- **Faster reaction time:** off-target machines are visible immediately, not at shift-end.
- **Less admin overhead:** no paper forms to transcribe or file.
- **Better decisions:** management can see trends (which machines/shifts underperform) and act on data instead of impressions.
- **Transparency:** one shared source of truth for hourly output across all shifts.
- **Low cost / no license fees:** built in-house with free-tier tools (Netlify + Firebase), no purchased software.

## 7. Status & Next Steps

This is a working, actively used prototype. Suggested next steps for wider rollout:
- Gather feedback from team leaders after a trial period on the line.
- Define user roles/permissions (operator entry vs. manager-only views).
- Add historical reporting/export (e.g., daily/weekly summary export).
- Evaluate integrating with existing plant systems if/when needed.

---
*Developed internally by Omar — Machining / SW CNC Production Line Department.*
