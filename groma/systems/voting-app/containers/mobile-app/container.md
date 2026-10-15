---
type: C4 Container
title: Mobile app
description: Expo Router client that hosts lobbies, voting, and settings on device.
status: draft
groma:
  id: mobile-app
  parent: voting-app
  technology: Expo Router, React Native, TypeScript
---

The only product runtime. File-based Expo Router screens wrap anonymous auth, onboarding, tab navigation, and the create/join → waiting room → voting → results flow. Persists local drafts and onboarding flags on device; syncs lobby and vote data with Firebase over REST (with limited native SDK use).
