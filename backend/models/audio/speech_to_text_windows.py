"""
Windows-compatible Speech-to-Text using SpeechRecognition
Uses Google Speech Recognition (online)
"""

import speech_recognition as sr
import time

class SpeechToText:
    def __init__(self, language="en", sample_rate=16000, device_index=None):
        """
        Initialize speech recognition for Windows.
        
        Args:
            language: 'hi' for Hindi, 'en' for English
            sample_rate: Audio sample rate (default: 16000)
            device_index: Microphone device index (default: None for system default)
        """
        self.language = language
        self.sample_rate = sample_rate
        self.device_index = device_index
        self.recognizer = sr.Recognizer()
        
        # Circuit breaker for microphone failures
        self.consecutive_failures = 0
        self.max_consecutive_failures = 5
        self.microphone_available = True
        
        # Language codes for Google Speech Recognition
        self.lang_codes = {
            'hi': 'hi-IN',
            'en': 'en-US'
        }
        
        print(f"[STT] Initialized Google Speech Recognition ({language})")
        
        # DEBUG: List microphones
        try:
            print("[STT DEBUG] Available Microphones:")
            mics = sr.Microphone.list_microphone_names()
            for i, name in enumerate(mics):
                print(f"  [{i}] {name}")
        except Exception as e:
            print(f"[STT DEBUG] Could not list microphones: {e}")

        self.calibrate()

    def calibrate(self):
        """Calibrate microphone for ambient noise."""
        print("[STT] Calibrating microphone for 1 second... Please remain silent.")
        try:
            with sr.Microphone(device_index=self.device_index) as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=1.0)
            print(f"[STT] Calibration complete. Energy threshold: {self.recognizer.energy_threshold}")
        except Exception as e:
            print(f"[STT WARNING] Calibration failed: {e}")

    def listen(self, timeout=5):
        """
        Listen for speech and convert to text.
        
        Args:
            timeout: Maximum listening duration in seconds
            
        Returns:
            str: Recognized text or None
        """
        # Circuit breaker: if microphone has failed too many times, don't try
        if not self.microphone_available:
            if self.consecutive_failures >= self.max_consecutive_failures:
                print("[STT] Microphone unavailable (circuit breaker activated)")
                import time
                time.sleep(2)  # Prevent tight loop
                return None
        
        print("[STT] Listening... (speak now)")
        
        mic = None
        try:
            # Create microphone instance
            mic = sr.Microphone(device_index=self.device_index)
            
            with mic as source:
                # Listen for audio (no adjustment here to avoid cutting off speech)
                # timeout = wait max this long for phrase to start
                # phrase_time_limit = max length of phrase
                audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=10)
                
                # Recognize speech using Google
                lang_code = self.lang_codes.get(self.language, 'en-US')
                text = self.recognizer.recognize_google(audio, language=lang_code)
                
                print(f"[STT] Recognized: {text}")
                # Reset failure counter on success
                self.consecutive_failures = 0
                self.microphone_available = True
                return text
                
        except sr.WaitTimeoutError:
            # This is normal if nobody speaks
            return None
        except sr.UnknownValueError:
            print(f"[STT] Could not understand audio (Threshold: {self.recognizer.energy_threshold})")
            return None
        except sr.RequestError as e:
            print(f"[STT ERROR] Could not request results: {e}")
            return None
        except AttributeError as e:
            # Handle the 'NoneType' object has no attribute 'close' error
            if "'NoneType' object has no attribute 'close'" in str(e):
                print(f"[STT ERROR] Microphone stream initialization failed")
                self.consecutive_failures += 1
                if self.consecutive_failures >= self.max_consecutive_failures:
                    self.microphone_available = False
                    print(f"[STT ERROR] Circuit breaker activated after {self.consecutive_failures} failures")
                    print("[STT ERROR] Please check your microphone connection and restart the application")
                return None
            else:
                print(f"[STT ERROR] {e}")
                return None
        except Exception as e:
            error_msg = str(e)
            # Check for the specific close() error
            if "close" in error_msg.lower() and "NoneType" in error_msg:
                print(f"[STT ERROR] Microphone stream error: {e}")
                self.consecutive_failures += 1
                if self.consecutive_failures >= self.max_consecutive_failures:
                    self.microphone_available = False
                    print(f"[STT ERROR] Circuit breaker activated after {self.consecutive_failures} failures")
                    print("[STT ERROR] Please check your microphone connection and restart the application")
                return None
            
            print(f"[STT ERROR] {e}")
            self.consecutive_failures += 1
            if self.consecutive_failures >= self.max_consecutive_failures:
                self.microphone_available = False
                print(f"[STT ERROR] Circuit breaker activated - microphone unavailable")
            return None
        finally:
            # Ensure cleanup
            if mic is not None:
                try:
                    if hasattr(mic, 'stream') and mic.stream is not None:
                        mic.stream.close()
                except:
                    pass  # Ignore cleanup errors

    
    def listen_continuous(self, callback, stop_event=None):
        """
        Continuous listening mode.
        
        Args:
            callback: Function to call with recognized text
            stop_event: threading.Event to stop listening
        """
        print("[STT] Starting continuous listening...")
        
        with sr.Microphone(device_index=self.device_index) as source:
            self.recognizer.adjust_for_ambient_noise(source)
            
            while True:
                if stop_event and stop_event.is_set():
                    break
                
                try:
                    audio = self.recognizer.listen(source, timeout=1, phrase_time_limit=5)
                    lang_code = self.lang_codes.get(self.language, 'en-US')
                    text = self.recognizer.recognize_google(audio, language=lang_code)
                    
                    if text:
                        callback(text)
                        
                except sr.WaitTimeoutError:
                    continue
                except sr.UnknownValueError:
                    continue
                except Exception as e:
                    print(f"[STT ERROR] {e}")
                    time.sleep(1)

if __name__ == "__main__":
    print("Testing Speech-to-Text (Windows)...")
    
    # Test Hindi
    stt_hi = SpeechToText(language="hi")
    print("\n[TEST 1] Hindi Recognition")
    print("Say something in Hindi...")
    text = stt_hi.listen(timeout=5)
    print(f"Result: {text}")
    
    # Test English
    stt_en = SpeechToText(language="en")
    print("\n[TEST 2] English Recognition")
    print("Say something in English...")
    text = stt_en.listen(timeout=5)
    print(f"Result: {text}")
