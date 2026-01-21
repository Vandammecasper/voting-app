const { withEntitlementsPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withVoipEntitlements(config) {
  // First, handle entitlements
  config = withEntitlementsPlist(config, (config) => {
    // Note: VoIP push notifications (PushKit) don't require aps-environment entitlement
    // aps-environment is only needed for regular push notifications, which require a paid Apple Developer account
    // VoIP push works with free/personal developer accounts
    // So we don't add aps-environment here
    return config;
  });

  // Modify Podfile to allow non-modular includes for Firebase compatibility
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Check if we already added the fix
        if (!podfileContent.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
          // Add the build setting to allow non-modular includes inside the post_install block
          const postInstallFix = `
    # Fix for React Native Firebase non-modular header includes
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;
          
          // Find the post_install block and add our fix inside it
          const postInstallRegex = /(post_install do \|installer\|[\s\S]*?)(^\s*end\s*$)/m;
          if (postInstallRegex.test(podfileContent)) {
            podfileContent = podfileContent.replace(
              postInstallRegex,
              `$1${postInstallFix}\n$2`
            );
            fs.writeFileSync(podfilePath, podfileContent, 'utf8');
            console.log('Added non-modular header fix to Podfile');
          }
        }
      }
      
      return config;
    },
  ]);

  // Then, inject Firebase config from environment variables into GoogleService-Info.plist
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const rootPlistPath = path.join(config.modRequest.projectRoot, 'GoogleService-Info.plist');
      const iosPlistPath = path.join(
        config.modRequest.platformProjectRoot,
        'votingapp',
        'GoogleService-Info.plist'
      );
      
      // Read environment variables (Expo loads .env files automatically)
      const apiKey = process.env.EXPO_PUBLIC_FIREBASE_APIKEY;
      const googleAppId = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_APP_ID;
      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECTID;
      const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const databaseUrl = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
      const bundleId = process.env.FIREBASE_BUNDLE_ID || config.ios?.bundleIdentifier;

      // Function to replace placeholders in plist content
      const replacePlaceholders = (content) => {
        if (apiKey) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_APIKEY\}/g, apiKey);
        }
        if (googleAppId) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_GOOGLE_APP_ID\}/g, googleAppId);
        }
        if (projectId) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_PROJECTID\}/g, projectId);
        }
        if (storageBucket) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET\}/g, storageBucket);
        }
        if (bundleId) {
          content = content.replace(/\$\{FIREBASE_BUNDLE_ID\}/g, bundleId);
        }
        if (databaseUrl) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_DATABASE_URL\}/g, databaseUrl);
        }
        return content;
      };

      // Update the root plist file if it exists
      if (fs.existsSync(rootPlistPath)) {
        let plistContent = fs.readFileSync(rootPlistPath, 'utf8');
        plistContent = replacePlaceholders(plistContent);
        fs.writeFileSync(rootPlistPath, plistContent, 'utf8');
      }

      // Also update the iOS directory plist file if it exists (generated during prebuild)
      if (fs.existsSync(iosPlistPath)) {
        let plistContent = fs.readFileSync(iosPlistPath, 'utf8');
        plistContent = replacePlaceholders(plistContent);
        fs.writeFileSync(iosPlistPath, plistContent, 'utf8');
      }
      
      return config;
    },
  ]);

  // Inject Firebase config from environment variables into google-services.json for Android
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const rootJsonPath = path.join(config.modRequest.projectRoot, 'google-services.json');
      const androidJsonPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'google-services.json'
      );
      
      // Read environment variables (Expo loads .env files automatically)
      const apiKey = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_API_KEY;
      const googleAppId = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_MOBILE_SDK_APP_ID;
      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECTID;
      const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const databaseUrl = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
      const androidPackageName = process.env.FIREBASE_ANDROID_PACKAGE_NAME || config.android?.package;

      // Function to replace placeholders in JSON content
      const replacePlaceholders = (content) => {
        if (projectId) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_PROJECTID\}/g, projectId);
        }
        if (storageBucket) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET\}/g, storageBucket);
        }
        if (googleAppId) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_GOOGLE_APP_ID\}/g, googleAppId);
        }
        if (androidPackageName) {
          content = content.replace(/\$\{FIREBASE_ANDROID_PACKAGE_NAME\}/g, androidPackageName);
        }
        if (apiKey) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_APIKEY\}/g, apiKey);
        }
        if (databaseUrl) {
          content = content.replace(/\$\{EXPO_PUBLIC_FIREBASE_DATABASE_URL\}/g, databaseUrl);
        }
        return content;
      };

      // Update the root JSON file if it exists
      if (fs.existsSync(rootJsonPath)) {
        let jsonContent = fs.readFileSync(rootJsonPath, 'utf8');
        jsonContent = replacePlaceholders(jsonContent);
        fs.writeFileSync(rootJsonPath, jsonContent, 'utf8');
      }

      // Also update the Android directory JSON file if it exists (generated during prebuild)
      if (fs.existsSync(androidJsonPath)) {
        let jsonContent = fs.readFileSync(androidJsonPath, 'utf8');
        jsonContent = replacePlaceholders(jsonContent);
        fs.writeFileSync(androidJsonPath, jsonContent, 'utf8');
      }
      
      return config;
    },
  ]);

  // Add build script to generate Hermes dSYM using withDangerousMod
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectPath = path.join(
        config.modRequest.platformProjectRoot,
        'morelifepatientportalapp.xcodeproj',
        'project.pbxproj'
      );

      if (!fs.existsSync(projectPath)) {
        console.warn('Xcode project file not found, skipping Hermes dSYM script');
        return config;
      }

      let projectContent = fs.readFileSync(projectPath, 'utf8');
      
      // Check if the script already exists
      if (projectContent.includes('Generate Hermes dSYM') || projectContent.includes('hermes.framework.dSYM')) {
        console.log('Hermes dSYM script already exists');
        return config;
      }

      // Generate a UUID for the build phase
      const uuid1 = generateUuid();
      const uuid2 = generateUuid();
      const uuid3 = generateUuid();

      // Script content - properly escaped for Xcode project file
      // Use $${VAR} format to escape $ in the Xcode project file
      const scriptLines = [
        'if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/hermes.framework" ]; then',
        '\techo "Generating dSYM for hermes.framework"',
        '\tdsymutil "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/hermes.framework/hermes" -o "${DWARF_DSYM_FOLDER_PATH}/hermes.framework.dSYM"',
        '\tif [ -d "${DWARF_DSYM_FOLDER_PATH}/hermes.framework.dSYM" ]; then',
        '\t\techo "Hermes dSYM generated successfully"',
        '\telse',
        '\t\techo "Warning: Failed to generate Hermes dSYM"',
        '\tfi',
        'fi'
      ];
      
      // Escape the script for Xcode project file format
      // Replace $ with $$ to escape it, and escape quotes and newlines
      const escapedScript = scriptLines
        .join('\\n')
        .replace(/\$/g, '$$')
        .replace(/"/g, '\\"');

      // Add the build phase section
      const buildPhaseSection = `\t\t${uuid1} /* Generate Hermes dSYM */ = {
\t\t\tisa = PBXShellScriptBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\tinputPaths = (
\t\t\t);
\t\t\tname = "Generate Hermes dSYM";
\t\t\toutputPaths = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t\tshellPath = /bin/sh;
\t\t\tshellScript = "${escapedScript}";
\t\t\tshowEnvVarsInLog = 0;
\t\t};`;

      // Insert the build phase before the end of PBXShellScriptBuildPhase section
      const shellScriptPhaseRegex = /(.*)(\/\* End PBXShellScriptBuildPhase section \*\/)/s;
      if (shellScriptPhaseRegex.test(projectContent)) {
        projectContent = projectContent.replace(
          shellScriptPhaseRegex,
          `$1${buildPhaseSection}\n\t\t$2`
        );
      } else {
        // If section doesn't exist, add it before PBXResourcesBuildPhase
        const resourcesPhaseRegex = /(\/\* Begin PBXResourcesBuildPhase section \*\/)/;
        projectContent = projectContent.replace(
          resourcesPhaseRegex,
          `/* Begin PBXShellScriptBuildPhase section */\n${buildPhaseSection}\n/* End PBXShellScriptBuildPhase section */\n$1`
        );
      }

      // Add the build phase reference to the target's buildPhases array
      // Find the main target (usually morelifepatientportalapp)
      const targetRegex = /(morelifepatientportalapp.*buildPhases = \(\s*)([^)]*)(\s*\);)/s;
      if (targetRegex.test(projectContent)) {
        projectContent = projectContent.replace(
          targetRegex,
          `$1$2\t\t\t${uuid2} /* Generate Hermes dSYM */,\n$3`
        );
      }

      fs.writeFileSync(projectPath, projectContent, 'utf8');
      console.log('Added Hermes dSYM generation script to Xcode project');
      
      return config;
    },
  ]);

  return config;
};

// Helper function to generate UUIDs in Xcode format
function generateUuid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

