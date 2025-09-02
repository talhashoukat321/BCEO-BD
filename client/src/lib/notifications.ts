import { useState } from "react";

// Notification sound utility
export class NotificationSound {
  private static audioContext: AudioContext | null = null;
  private static isEnabled = true;

  // Initialize audio context
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Create a beep sound using Web Audio API
  static playNotificationSound(frequency = 800, duration = 200, volume = 0.5) {
    console.log("Attempting to play sound - enabled:", this.isEnabled, "frequency:", frequency);
    
    if (!this.isEnabled) {
      console.log("Sound disabled, not playing");
      return;
    }

    try {
      const audioContext = this.getAudioContext();
      
      // Resume audio context if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Create oscillator for tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure oscillator
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Configure gain (volume)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
      
      console.log("Sound played successfully");
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Play new order notification (double beep)
  static playNewOrderNotification() {
    this.playNotificationSound(800, 150, 0.4);
    setTimeout(() => {
      this.playNotificationSound(1000, 150, 0.4);
    }, 200);
  }

  // Enable/disable notifications
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Check if notifications are enabled
  static isNotificationEnabled() {
    return this.isEnabled;
  }
}

// Hook for managing notification preferences
export const useNotificationSound = () => {
  const [isEnabled, setIsEnabled] = useState(NotificationSound.isNotificationEnabled());

  const playNewOrderSound = () => {
    console.log("Playing new order sound, enabled:", isEnabled);
    NotificationSound.playNewOrderNotification();
  };

  const toggleNotifications = () => {
    const newState = !isEnabled;
    console.log("Toggling notifications from", isEnabled, "to", newState);
    NotificationSound.setEnabled(newState);
    setIsEnabled(newState);
    return newState;
  };

  const testSound = () => {
    console.log("Testing notification sound");
    NotificationSound.playNewOrderNotification();
  };

  return {
    playNewOrderSound,
    toggleNotifications,
    testSound,
    isEnabled
  };
};