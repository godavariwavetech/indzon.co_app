#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <RCTAppDependencyProvider.h>
#import <Firebase.h>

@interface SceneDelegate : UIResponder <UIWindowSceneDelegate>
@property (nonatomic, strong) UIWindow *window;
@end

@interface AppDelegate ()
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  (void)application;
  (void)launchOptions;

  NSString *firebaseConfigPath = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (firebaseConfigPath != nil && [FIRApp defaultApp] == nil) {
    [FIRApp configure];
  } else if (firebaseConfigPath == nil) {
    NSLog(@"GoogleService-Info.plist is missing; starting without Firebase configuration.");
  }
  // Keep this in sync with the name registered in index.js via app.json.
  self.moduleName = @"melocal";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Create the React Native factory here, but wait for SceneDelegate to provide
  // the UIWindowScene-backed window before starting the React Native surface.
  self.dependencyProvider = [RCTAppDependencyProvider new];
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  (void)session;
  (void)connectionOptions;

  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }

  AppDelegate *appDelegate = (AppDelegate *)UIApplication.sharedApplication.delegate;
  if (appDelegate == nil || appDelegate.reactNativeFactory == nil) {
    return;
  }

  UIWindow *window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
  self.window = window;
  appDelegate.window = window;

  [appDelegate.reactNativeFactory startReactNativeWithModuleName:appDelegate.moduleName
                                                       inWindow:window
                                                  launchOptions:nil];
}

@end
