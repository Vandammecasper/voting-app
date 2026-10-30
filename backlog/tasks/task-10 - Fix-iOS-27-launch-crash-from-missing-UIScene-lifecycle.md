---
id: TASK-10
title: Fix iOS 27 launch crash from missing UIScene lifecycle
status: Request Accepted
assignee: []
created_date: '2026-10-30 22:33'
labels: []
dependencies: []
references:
  - 'https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md'
  - 'https://github.com/expo/expo/issues/46664'
  - Apple TN3187
priority: high
type: bug
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TestFlight crash report ACQgkm0owHyB7Gj76ZtovTo (2026-10-30 23:21 Europe/Brussels) shows MVP vote 1.7.2 (1) dying immediately on launch on iPhone18,3 / iOS 27.0 with EXC_BREAKPOINT in UIKit ___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption. The live App Store/TestFlight build was uploaded from the hand-managed ios/ project (App Store Tools 27B47) and still creates UIWindow in AppDelegate without UIApplicationSceneManifest. iOS 27 SDK requires UIScene adoption; Expo SDK 54 template used here does not provide it. Secondary risk in the same native project: GoogleService-Info.plist BUNDLE_ID is the Android package com.caspervd.voting_app, and DATABASE_URL can remain an unsubstituted placeholder when building outside EAS env substitution.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 App launches on iOS 27 without EXC_BREAKPOINT / NoSceneLifecycleAdoption
- [ ] #2 ios Info.plist declares UIApplicationSceneManifest wired to a scene delegate that starts React Native
- [ ] #3 AppDelegate no longer owns window creation / startReactNative for the iOS 27 scene path
- [ ] #4 A new iOS build is produced and verified on an iOS 27 device or simulator
<!-- AC:END -->
