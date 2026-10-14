New authentication flow

All new screens and their assets live inside src_new.
No screens or image assets from the original src are included in this flow.

Screens
- screens/SplashScreen.jsx: startup while persisted state is loading.
- screens/onboarding/OnboardingScreen.jsx: three artwork slides, Skip and Next.
- screens/auth/LoginScreen.jsx: mobile validation and Request OTP.
- screens/auth/OtpVerificationScreen.jsx: four-digit input, SMS autofill,
  resend countdown, change number, server verification and error messages.
- screens/auth/AuthenticatedScreen.jsx: authentication completion and sign out.

Assets and reference
- assets/brand/app-logo.png
- assets/onboarding/onboarding-food-v3.png
- assets/onboarding/onboarding-grocery-v3.png
- assets/onboarding/onboarding-delivery-v3.png
These are sourced from D:\client\product\multivendor_public_app\src\assets.
components/auth contains that reference's vector logo, background circles,
card header and shield, with local imports. The reference's Godavari Wave
wordmark is retained as part of its sign-in design.
The previous Amaraa topbar, logo banner, authbg and onboarding images were
removed from src_new. assets/index.js exports only the new image assets.

Entry and navigation
src_new/App.jsx mounts the new flow with its Redux store, PersistGate,
SafeAreaProvider and NavigationContainer. Root App.jsx exports src_new/App.jsx,
so the registered app launches this new flow.
AppNavigation defaults to the new screens and remembers completed onboarding.
It switches to authenticated routes after verification. Supply
 authenticatedRoutes: [{name, component, options?, initialParams?}]
to replace the completion screen with future new home screens.
Existing stack/tab entry filenames remain available and accept route arrays.

Authentication
The new authService uses the existing Amaraa getuserloginotp/customerlogin
endpoints. It verifies OTP with the server, accepts the returned customer ID
and optional access token, and never fabricates a token or compares a returned
OTP locally. The new screens use completeAuthentication, not legacy
placeholder actionLogin. Backend success and response failures are checked.
OTP requests were validated with mocked responses; no live customer requests
were sent during development.

Shared infrastructure
commonstyles, components, config, redux, services and utils still contain the
reusable original infrastructure. No original screen modules are imported.
Persistence keys are amaraa-new-auth and amaraa-new-dashboardCart; onboarding
uses amaraa-new-onboarding-complete. Existing sessions are not migrated.
__tests__/authFlow.test.js covers request validation, backend rejection,
server verification, customer sessions and sign out.
