const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const MARKER = '// scene lifecycle (with-scene-lifecycle.js)';

// Stock SDK 54 window startup, and the Firebase-plugin variant that injects
// FirebaseApp.configure() inside the same #if block.
const WINDOW_BLOCK_STOCK = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

const WINDOW_BLOCK_FIREBASE = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

const WINDOW_REPLACEMENT_STOCK = `#if os(iOS) || os(tvOS)
    // The window is made by SceneDelegate (required by the iOS 27 SDK).
#endif
`;

const WINDOW_REPLACEMENT_FIREBASE = `#if os(iOS) || os(tvOS)
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    // The window is made by SceneDelegate (required by the iOS 27 SDK).
#endif
`;

const SCENE_DELEGATE = `
${MARKER}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else { return }

    // Cold-launch links arrive here, not in AppDelegate launch options.
    // Forward through AppDelegate so expo-linking / expo-router see the URL.
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
      _ = appDelegate.application(UIApplication.shared, open: url, options: [:])
    } else if let activity = connectionOptions.userActivities.first(where: {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }), let url = activity.webpageURL {
      launchOptions[.url] = url
      _ = appDelegate.application(
        UIApplication.shared,
        continue: activity,
        restorationHandler: { _ in })
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions.isEmpty ? nil : launchOptions)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    for context in URLContexts {
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in })
  }
}
`;

function patchAppDelegate(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }
  if (contents.includes('ExpoAppSceneDelegate') || contents.includes('EXExpoAppSceneDelegate')) {
    throw new Error(
      'with-scene-lifecycle: Expo already provides a UIScene template. Remove this plugin.',
    );
  }

  let next = contents;
  if (next.includes(WINDOW_BLOCK_FIREBASE)) {
    next = next.replace(WINDOW_BLOCK_FIREBASE, WINDOW_REPLACEMENT_FIREBASE);
  } else if (next.includes(WINDOW_BLOCK_STOCK)) {
    next = next.replace(WINDOW_BLOCK_STOCK, WINDOW_REPLACEMENT_STOCK);
  } else {
    throw new Error(
      'with-scene-lifecycle: the window block in AppDelegate.swift was not found. ' +
        'If another plugin has edited that block, this one has to match its output; ' +
        'if this Expo SDK adopts UIScene itself, remove this plugin.',
    );
  }
  return next + SCENE_DELEGATE;
}

function withSceneLifecycle(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return mod;
  });

  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error('with-scene-lifecycle expects a Swift AppDelegate.');
    }
    mod.modResults.contents = patchAppDelegate(mod.modResults.contents);
    return mod;
  });
}

module.exports = withSceneLifecycle;
module.exports.patchAppDelegate = patchAppDelegate;
