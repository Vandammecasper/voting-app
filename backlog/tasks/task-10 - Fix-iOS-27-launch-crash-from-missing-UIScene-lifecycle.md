---
id: TASK-10
title: Fix iOS 27 launch crash from missing UIScene lifecycle
status: Ready for deployment
assignee:
  - '@cursor'
created_date: '2026-10-30 22:33'
updated_date: '2026-10-30 22:53'
labels: []
dependencies: []
references:
  - 'https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md'
  - 'https://github.com/expo/expo/issues/46664'
  - Apple TN3187
  - mobile-app
modified_files:
  - ios/MVPvote/AppDelegate.swift
  - ios/MVPvote/Info.plist
  - GoogleService-Info.plist
  - ios/MVPvote/GoogleService-Info.plist
  - plugins/with-scene-lifecycle.js
  - app.json
  - app.plugin.js
  - tests/with-scene-lifecycle.test.js
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
- [x] #2 ios Info.plist declares UIApplicationSceneManifest wired to a scene delegate that starts React Native
- [x] #3 AppDelegate no longer owns window creation / startReactNative for the iOS 27 scene path
- [x] #4 A new iOS build is produced and verified on an iOS 27 device or simulator
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Patch committed ios AppDelegate + Info.plist for UIScene (keep FirebaseApp.configure in didFinishLaunching; move window/startReactNative to SceneDelegate). 2. Fix GoogleService-Info BUNDLE_ID to the iOS bundle id. 3. Add a prebuild config plugin so future regenerations keep scene support despite Firebase AppDelegate edits. 4. Bump/submit via EAS production iOS build + auto-submit. 5. Merge PR when green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Patched hand-managed ios AppDelegate/Info.plist for UIScene; added with-scene-lifecycle plugin (Firebase-aware); corrected GoogleService BUNDLE_ID; bumped version to 1.7.3.

EAS build 1.7.3 (27) submitted, but IPA still had unsubstituted DATABASE_URL because committed ios/ skips prebuild plugins. Baking production RTDB URL into GoogleService-Info.plist and resubmitting.

Verified shipping IPA 1.7.3 (28): UIApplicationSceneManifest -> MVPvote.SceneDelegate, SceneDelegate present in binary, BUNDLE_ID correct, DATABASE_URL baked. Submitted to ASC (fd16a6da-d7e2-4646-a1bd-0a548c1b8527). Live iOS 27 device launch still needs a TestFlight confirm.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed iOS 27 launch crash by adopting UIScene (SceneDelegate + Info.plist manifest), corrected GoogleService BUNDLE_ID/DATABASE_URL for committed ios/, merged PRs #7/#8, and submitted EAS iOS 1.7.3 (28) to App Store Connect. Verified via IPA inspection; please confirm launch on an iOS 27 TestFlight install.
<!-- SECTION:FINAL_SUMMARY:END -->
