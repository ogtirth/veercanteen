// Sound Effects Utility for Canteen App
// Uses Web Audio API for crisp, instant sounds

class SoundManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private enabled: boolean = true;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.3; // Master volume
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', String(enabled));
    }
  }

  isEnabled(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('soundEnabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    }
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.isEnabled() || typeof window === 'undefined') return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.log('Sound not available');
    }
  }

  // Add item to cart - cheerful rising tone
  addToCart() {
    this.playTone(523.25, 0.1, 'sine', 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.2), 50); // E5
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.25), 100); // G5
  }

  // Remove item from cart - descending tone
  removeFromCart() {
    this.playTone(440, 0.1, 'sine', 0.15); // A4
    setTimeout(() => this.playTone(349.23, 0.15, 'sine', 0.1), 80); // F4
  }

  // Update quantity - subtle click
  updateQuantity() {
    this.playTone(800, 0.05, 'sine', 0.1);
  }

  // Order placed - triumphant fanfare
  orderPlaced() {
    this.playTone(523.25, 0.15, 'sine', 0.25); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.25), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.25), 200); // G5
    setTimeout(() => this.playTone(1046.5, 0.3, 'sine', 0.3), 300); // C6
  }

  // Payment success - cash register style
  paymentSuccess() {
    this.playTone(880, 0.1, 'triangle', 0.2);
    setTimeout(() => this.playTone(1108.73, 0.1, 'triangle', 0.2), 100);
    setTimeout(() => this.playTone(1318.51, 0.2, 'triangle', 0.25), 200);
  }

  // Error sound - low warning
  error() {
    this.playTone(200, 0.15, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(180, 0.2, 'sawtooth', 0.1), 100);
  }

  // Success notification - pleasant chime
  success() {
    this.playTone(659.25, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(880, 0.15, 'sine', 0.2), 80);
  }

  // Button click - subtle tap
  click() {
    this.playTone(600, 0.03, 'sine', 0.08);
  }

  // Navigation sound - whoosh
  navigate() {
    this.playTone(400, 0.08, 'sine', 0.1);
    setTimeout(() => this.playTone(500, 0.06, 'sine', 0.08), 40);
  }

  // Order status update
  statusUpdate() {
    this.playTone(523.25, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(698.46, 0.15, 'sine', 0.18), 100);
  }

  // Item saved - save confirmation
  itemSaved() {
    this.playTone(440, 0.08, 'sine', 0.15);
    setTimeout(() => this.playTone(554.37, 0.08, 'sine', 0.15), 60);
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.2), 120);
  }

  // Item deleted - removal sound
  itemDeleted() {
    this.playTone(350, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(280, 0.15, 'sine', 0.1), 80);
  }

  // Alert/notification sound
  notification() {
    this.playTone(880, 0.08, 'sine', 0.15);
    setTimeout(() => this.playTone(880, 0.08, 'sine', 0.12), 150);
  }

  // New order alert - attention grabbing sound
  newOrderAlert() {
    // Play a distinctive alert sound
    this.playTone(880, 0.15, 'sine', 0.3); // A5
    setTimeout(() => this.playTone(1174.66, 0.15, 'sine', 0.3), 150); // D6
    setTimeout(() => this.playTone(1318.51, 0.2, 'sine', 0.35), 300); // E6
    setTimeout(() => this.playTone(1760, 0.3, 'sine', 0.4), 450); // A6
  }

  // Text-to-speech announcement
  speak(text: string) {
    if (!this.isEnabled() || typeof window === 'undefined') return;
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-IN'; // Indian English
      
      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.log('Speech synthesis not available');
    }
  }

  // Announce new order with amount
  announceNewOrder(amount: number, invoiceNumber?: string) {
    this.newOrderAlert();
    setTimeout(() => {
      const text = invoiceNumber 
        ? `New order received. ${amount} rupees. Order number ${invoiceNumber.slice(-4)}.`
        : `New order received. ${amount} rupees.`;
      this.speak(text);
    }, 600);
  }
}

// Export singleton instance
export const sounds = new SoundManager();

// Hook for React components
import { useCallback } from 'react';

export function useSounds() {
  const addToCart = useCallback(() => sounds.addToCart(), []);
  const removeFromCart = useCallback(() => sounds.removeFromCart(), []);
  const updateQuantity = useCallback(() => sounds.updateQuantity(), []);
  const orderPlaced = useCallback(() => sounds.orderPlaced(), []);
  const paymentSuccess = useCallback(() => sounds.paymentSuccess(), []);
  const error = useCallback(() => sounds.error(), []);
  const success = useCallback(() => sounds.success(), []);
  const click = useCallback(() => sounds.click(), []);
  const navigate = useCallback(() => sounds.navigate(), []);
  const statusUpdate = useCallback(() => sounds.statusUpdate(), []);
  const itemSaved = useCallback(() => sounds.itemSaved(), []);
  const itemDeleted = useCallback(() => sounds.itemDeleted(), []);
  const notification = useCallback(() => sounds.notification(), []);
  const newOrderAlert = useCallback(() => sounds.newOrderAlert(), []);
  const speak = useCallback((text: string) => sounds.speak(text), []);
  const announceNewOrder = useCallback((amount: number, invoiceNumber?: string) => sounds.announceNewOrder(amount, invoiceNumber), []);
  const setEnabled = useCallback((enabled: boolean) => sounds.setEnabled(enabled), []);
  const isEnabled = useCallback(() => sounds.isEnabled(), []);

  return {
    addToCart,
    removeFromCart,
    updateQuantity,
    orderPlaced,
    paymentSuccess,
    error,
    success,
    click,
    navigate,
    statusUpdate,
    itemSaved,
    itemDeleted,
    notification,
    newOrderAlert,
    speak,
    announceNewOrder,
    setEnabled,
    isEnabled,
  };
}
