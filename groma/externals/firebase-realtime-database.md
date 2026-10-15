---
type: C4 System
title: Firebase Realtime Database
description: Stores lobbies, votes, teams, and app config.
status: stable
groma:
  id: firebase-realtime-database
  technology: Firebase Realtime Database
---

Holds lobby state, participants, votes, receipts, user history, saved teams, feature requests, and force-update config. The app primarily reads and writes via authenticated HTTPS REST, with limited native SDK use for subscriptions.
