# TestFlight deployment

The `iOS TestFlight` GitHub Actions workflow builds the `localdaddy` Xcode
scheme and uploads the IPA to App Store Connect when manually dispatched.
It runs on a macOS GitHub-hosted runner; an iOS build cannot be produced on
the Windows development machine.

Configure these GitHub Actions repository secrets before dispatching it:

| Secret | Value |
| --- | --- |
| `APP_STORE_CONNECT_KEY_ID` | App Store Connect API key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect API issuer ID |
| `APP_STORE_CONNECT_KEY_BASE64` | Base64-encoded `.p8` API key file contents |
| `IOS_BUNDLE_ID` | Registered App Store bundle identifier |
| `IOS_TEAM_ID` | Apple Developer team ID |
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Base64-encoded distribution `.p12` certificate |
| `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD` | Password used for that `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded App Store provisioning profile |
| `IOS_PROVISIONING_PROFILE_NAME` | Provisioning profile name matching the profile above |
| `IOS_KEYCHAIN_PASSWORD` | Temporary CI keychain password |

The bundle identifier must match the provisioning profile and the App Store
Connect app record. The workflow does not run on pushes; dispatch it from the
GitHub Actions tab after configuring the secrets.
