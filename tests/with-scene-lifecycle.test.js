const { patchAppDelegate } = require('../plugins/with-scene-lifecycle');

const STOCK = `public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

const FIREBASE = `public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

describe('with-scene-lifecycle patchAppDelegate', () => {
  it('moves stock SDK 54 window startup into SceneDelegate', () => {
    const patched = patchAppDelegate(STOCK);
    expect(patched).toContain('class SceneDelegate: UIResponder, UIWindowSceneDelegate');
    expect(patched).toContain('factory.startReactNative(');
    expect(patched).not.toMatch(/window = UIWindow\(frame: UIScreen\.main\.bounds\)/);
    expect(patched.match(/factory\.startReactNative\(/g)).toHaveLength(1);
  });

  it('keeps FirebaseApp.configure while moving window startup', () => {
    const patched = patchAppDelegate(FIREBASE);
    expect(patched).toContain('FirebaseApp.configure()');
    expect(patched).toContain('class SceneDelegate: UIResponder, UIWindowSceneDelegate');
    expect(patched).not.toMatch(/window = UIWindow\(frame: UIScreen\.main\.bounds\)/);
    expect(patched).toContain('UIWindow(windowScene: windowScene)');
  });

  it('is idempotent when the marker is already present', () => {
    const once = patchAppDelegate(FIREBASE);
    const twice = patchAppDelegate(once);
    expect(twice).toBe(once);
  });
});
