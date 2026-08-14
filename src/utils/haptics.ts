// Haptic feedback utility for mobile touch interactions
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'celebrate' = 'light') => {
  if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([15, 40, 20]);
        break;
      case 'celebrate':
        navigator.vibrate([30, 40, 30, 60, 40, 80, 50]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Ignore devices/browsers that block vibration without user interaction
  }
};
