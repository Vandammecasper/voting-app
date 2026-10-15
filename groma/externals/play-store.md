---
type: C4 System
title: Play Store
description: Android distribution and update destination.
status: stable
groma:
  id: play-store
  technology: Google Play Store
---

Hosts the Android build. The version gate opens a configured androidStoreUrl, or a package-id Play Store URL fallback, when the installed app is below the remote minimum version.
