# Migration: `Swiftchat without login` → `Swiftchat prototype`

This prototype was synchronised with the feature branch shipped as
`SwiftChat-Prototype-No-Login-main.zip`. The login / SSO / OTP flow has
been preserved; everything else was lifted from the no-login source.

## What was migrated

### New feature modules (all new files, no merge required)

- `features/askAi/` (`askAiActions`, `askAiCardHtml`, `askAiEngine`, `askAiMatcher`)
- `components/askAi/` (`AskAiActionButtons`, `AskAiInsightCard`, `AskAiPromptGroup`, `AskAiPromptPanel`, `AskAiResultCard`)
- `data/askAi/` (`askAiMockData`, `askAiPrompts`, `askAiResponses`)
- New canvas modules:
  `AtRiskStudentsCanvas`, `ClassReportCanvas`, `InterventionCanvas`,
  `LessonPlanCanvas`, `StudentRosterCanvas`, `WorksheetEditorCanvas`,
  `WorksheetTemplateCanvas`
- `pages/HomePage.jsx` (alternate home variant; `SuperHomePage` remains the active home)
- `components/OTPInput.jsx`, `components/ShieldIcon.jsx`,
  `components/notifications/NotificationBadge.jsx`
- `hooks/useNavigation.js`, `hooks/useToast.js`
- `notifications/notificationActions.js` (action-router for notification actions)
- `utils/i18n.js`

### Refactored notification stack

The entire `src/notifications/` directory was replaced with the no-login
version (new `notificationStore`, `notificationScheduler`,
`notificationTargeting`, `notificationSeed`, `notificationSound`,
`notificationTypes`, `systemNotifications`, plus the new
`notificationActions`). All notification UI components were upgraded to
match (`NotificationBell`, `NotificationCanvas`, `NotificationFilters`,
`NotificationItem`, `NotificationList`, `NotificationToast`).

The mounted `NotificationCanvas` is now opened through `CanvasPanel` via
`canvasContext.type === 'notifications'` rather than as a sibling of the
canvas. App.jsx no longer mounts `NotificationCanvas` directly.

### Updated NLP / chat layers

- `nlp/actionRegistry.js`, `nlp/localPatterns.js`, `nlp/moduleRegistry.js`,
  `nlp/aiAnswerCard.js`, `nlp/__tests__/qaCases.json`,
  `nlp/__tests__/qaRunner.test.mjs`
- `hooks/useChat.js`
- `components/ChatBubble`, `ChatInput`, `QuickReplies`, `TypingIndicator`,
  `BottomNav`, `TopBar`, `StatusBar`, `Logo`, `Toast`, `AttendanceGrid`,
  `CallOverlay` (visual / behaviour updates)
- Pages: `ChatPage`, `NamoLaxmiPage`, `UpdatesPage`,
  `SuperHomePage`
- Existing canvas modules upgraded: `CanvasPanel`, `ActivityLog`,
  `DataForm`, `ExportOptions`, `RichTextEditor`, `AttendanceCanvas`,
  `DashboardCanvas`, `DataEntryCanvas`, `PDFCanvas`, `ReportCanvas`
- Utils: `chatData.js`, `helpers.js`, `namoFlow.js`
- Data: `mockData.js`, `roles/roleConfig.js`
- Styles: `index.css`, plus updated SVG/JSX assets under `assets/`

### Surgical merges (login + new features kept side-by-side)

- **`src/App.jsx`** — kept the prototype's auth screens (`splash`,
  `login`, `select_state`, `sso_redirect`, `sso_verifying`, `sso_ok`,
  `sso_fail`, `phone_entry`, `phone_otp`) and `STATIC_ROUTES`. Removed the
  duplicate top-level `<NotificationCanvas />` mount because
  `CanvasPanel` now hosts it via the `notifications` canvas type.
- **`src/context/AppContext.jsx`** — adopted the no-login version
  (refactored notification API, `switchRole`, scheduler bridge, chat
  trigger queue) but **restored login-aware initial state**: a fresh boot
  starts on `splash` with `role = null`, `userProfile = null`; only a
  persisted role hydrates straight into the post-login experience.
  `signOut()` returns the user to `splash` and clears the persisted
  session, instead of resetting to a default user.
- **`src/pages/SuperHomePage.jsx`** — re-injected the prototype's
  data-query NLP layer (`routeDataQuery`, `isQuestionShape`,
  `aiAnalyticsCardHtml`) so analytics-style questions ("kitne students?",
  "how many?") still render via the analytics card and survive the new
  routing pipeline.
- **`src/canvas/CanvasPanel.jsx`** — added back the `KnowledgeCanvas`
  type alongside the new no-login canvas modules.

### Files preserved from prototype only (not in no-login)

- Auth pages: `LoginPage`, `SplashPage`, `PhoneEntryPage`, `PhoneOTPPage`,
  `SelectStatePage`, `SSORedirectPage`, `SSOVerifyingPage`,
  `SSOSuccessPage`, `SSOFailPage`, `ProfilePage`
- `canvas/modules/KnowledgeCanvas.jsx`
- `data/analytics/` (`attendanceAnalytics`, `classAnalytics`,
  `digivrittiAnalytics`, `paymentAnalytics`, `xamtaAnalytics`)
- `nlp/aiAnalyticsCard.js`, `nlp/dataAnswerBuilder.js`,
  `nlp/dataQueryPatterns.js`, `nlp/dataQueryRouter.js`
- `nlp/__tests__/diagnose.mjs`, `nlp/__tests__/probeGemini.mjs`

## Login / auth flow (preserved)

- App boots on `splash` whenever there is no persisted session.
- `splash → login → (select_state | sso_*) → home` paths are unchanged.
- `phone_entry → phone_otp → home` path is unchanged.
- Persisted role + screen continue to hydrate into the post-login
  experience.
- `signOut()` clears the persisted session and returns to `splash`.

## Dependencies / configuration

`package.json`, `vite.config.js`, `tailwind.config.js`,
`postcss.config.js`, and `index.html` are byte-identical to the no-login
source — no new runtime dependencies were required.

## How to run

```bash
npm install
npm run dev          # development server on localhost:5173
npm run build        # production build into dist/
npm run preview      # serve the production build locally
```

## Verified

- `npm run build` succeeds (no transform errors, 1849 modules).
- Vite dev server boots cleanly and serves `App.jsx`,
  `context/AppContext.jsx`, and `pages/SuperHomePage.jsx` without parse
  errors.

## Known limitations / assumptions

- The alternate `pages/HomePage.jsx` ships with the migration but is
  **not wired into routing** — `SuperHomePage` remains the active home
  per the prototype's `App.jsx`. It is left in place so future work can
  swap implementations without re-importing the file.
- `notificationScheduler.startScheduler` now starts only after a role is
  set (because `notificationUser` is null pre-login). On sign-out the
  scheduler is stopped explicitly.
- The no-login version mounted `NotificationCanvas` only through the
  canvas system. The prototype mirrors that behaviour to avoid duplicate
  DOM trees.
