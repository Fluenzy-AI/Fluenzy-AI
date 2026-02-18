"""
Wake Word Detection for "Jeeva"
Listens continuously for activation phrase
"""

import time

try:
    import sounddevice as sd
    import numpy as np
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False

class WakeWordDetector:
    def __init__(self, wake_words=None, sensitivity=0.7):
        """
        Initialize wake word detector.
        
        Args:
            wake_words: List of wake words (default: ["jeeva", "hey jeeva"])
            sensitivity: Detection sensitivity 0.0-1.0
        """
        self.wake_words = wake_words or [
            "jeeva", "hey jeeva", "wake up", "start listening", "are you there", "listen"
        ]
        self.sensitivity = sensitivity
        self.is_active = False
        
        print(f"[WAKE WORD] Initialized with words: {self.wake_words}")
    
    def detect_simple(self, text):
        """
        Simple keyword matching for wake word detection.
        
        Args:
            text: Transcribed text from STT
            
        Returns:
            bool: True if wake word detected
        """
        if not text:
            return False
        
        text_lower = text.lower().strip()
        
        for wake_word in self.wake_words:
            if wake_word.lower() in text_lower:
                print(f"[WAKE WORD] Detected: '{wake_word}' in '{text}'")
                return True
        
        return False
    
    def listen_for_wake_word(self, stt_engine, callback):
        """
        Continuously listen for wake word using STT engine.
        
        Args:
            stt_engine: SpeechToText instance
            callback: Function to call when wake word detected
        """
        print("[WAKE WORD] Listening for wake word...")
        print(f"Say one of: {', '.join(self.wake_words)}")
        
        self.is_active = True
        
        while self.is_active:
            try:
                # Listen for short duration
                text = stt_engine.listen(timeout=60)
                
                if text and self.detect_simple(text):
                    print("[WAKE WORD] Activated!")
                    callback()
                
                # Small delay to prevent CPU overload
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                print("\n[WAKE WORD] Stopped by user")
                break
            except Exception as e:
                print(f"[WAKE WORD ERROR] {e}")
                time.sleep(1)
    
    def stop(self):
        """Stop wake word detection."""
        self.is_active = False
        print("[WAKE WORD] Stopped")

if __name__ == "__main__":
    print("Testing Wake Word Detection...")
    
    # Simulate wake word detection
    detector = WakeWordDetector()
    
    test_phrases = [
        "hello there",
        "hey jeeva",
        "jeeva are you there",
        "wake up",
        "start listening",
        "what is the weather",
        "jeeva help me"
    ]
    
    print("\n[TEST] Testing wake word detection:")
    for phrase in test_phrases:
        result = detector.detect_simple(phrase)
        status = "✓ DETECTED" if result else "✗ Not detected"
        print(f"  '{phrase}' → {status}")
