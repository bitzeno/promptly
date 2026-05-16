#include <napi.h>
#include <CoreGraphics/CoreGraphics.h>
#import <AppKit/AppKit.h>

// Store the previously active app's PID
static pid_t previousAppPID = 0;

Napi::Value SaveFrontmostApp(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  NSRunningApplication* frontApp =
      [[NSWorkspace sharedWorkspace] frontmostApplication];
  if (frontApp) {
    previousAppPID = [frontApp processIdentifier];
  }

  return env.Undefined();
}

Napi::Value ActivatePreviousApp(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (previousAppPID != 0) {
    NSRunningApplication* app =
        [NSRunningApplication runningApplicationWithProcessIdentifier:previousAppPID];
    if (app) {
      [app activateWithOptions:NSApplicationActivateIgnoringOtherApps];
    }
  }

  return env.Undefined();
}

Napi::Value SimulatePaste(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);

  // Virtual key code for 'v' is 9
  CGEventRef keyDown = CGEventCreateKeyboardEvent(source, 9, true);
  CGEventRef keyUp = CGEventCreateKeyboardEvent(source, 9, false);

  CGEventSetFlags(keyDown, kCGEventFlagMaskCommand);
  CGEventSetFlags(keyUp, kCGEventFlagMaskCommand);

  CGEventPost(kCGHIDEventTap, keyDown);
  CGEventPost(kCGHIDEventTap, keyUp);

  CFRelease(keyDown);
  CFRelease(keyUp);
  if (source) CFRelease(source);

  return env.Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("saveFrontmostApp", Napi::Function::New(env, SaveFrontmostApp));
  exports.Set("activatePreviousApp", Napi::Function::New(env, ActivatePreviousApp));
  exports.Set("simulatePaste", Napi::Function::New(env, SimulatePaste));
  return exports;
}

NODE_API_MODULE(paste, Init)
