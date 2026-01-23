/**
 * Test Proctoring Utilities
 * 
 * Functions to track and prevent cheating during tests
 */

/**
 * Track suspicious activity during tests
 */
export async function trackTestActivity(
  sessionId: string,
  activity: string,
  timestamp: number
): Promise<void> {
  // This would call the Convex mutation
  // Implementation depends on your Convex setup
  console.log("Tracking activity:", { sessionId, activity, timestamp });
}

/**
 * Prevent copy/paste
 */
export function preventCopyPaste(): void {
  document.addEventListener("copy", (e) => e.preventDefault());
  document.addEventListener("paste", (e) => e.preventDefault());
  document.addEventListener("cut", (e) => e.preventDefault());
}

/**
 * Prevent right-click
 */
export function preventRightClick(): void {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

/**
 * Detect if user switches tabs/windows
 */
export function onTabSwitch(callback: () => void): () => void {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      callback();
    }
  };

  const handleBlur = () => {
    callback();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleBlur);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleBlur);
  };
}

/**
 * Request fullscreen mode
 */
export async function requestFullscreen(): Promise<boolean> {
  try {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
      return true;
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to enter fullscreen:", error);
    return false;
  }
}

/**
 * Exit fullscreen mode
 */
export async function exitFullscreen(): Promise<void> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    }
  } catch (error) {
    console.error("Failed to exit fullscreen:", error);
  }
}

/**
 * Check if currently in fullscreen
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement
  );
}
