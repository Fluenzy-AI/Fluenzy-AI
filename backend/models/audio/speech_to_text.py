"""
Offline Speech-to-Text using Vosk
Supports Hindi and English
"""

import json
import os

try:
    import vosk
    import sounddevice as sd
    import queue
    VOSK_AVAILABLE = True
except ImportError:
    print("[WARNING] Vosk or sounddevice not installed. Running in simulation mode.")
    VOSK_AVAILABLE = False

class SpeechToText:
    def __init__(self, model_path=None, language="hi", sample_rate=16000, device_index=None):
        """
        Initialize speech recognition.
        
        Args:
            model_path: Path to Vosk model directory
            language: 'hi' for Hindi, 'en' for English
            sample_rate: Audio sample rate (default: 16000)
            device_index: Microphone device index (default: None for system default)
        """
        self.language = language
        self.sample_rate = sample_rate
        self.device_index = device_index
        self.model = None
        self.recognizer = None
        
        # Circuit breaker for microphone failures
        self.consecutive_failures = 0
        self.max_consecutive_failures = 5
        self.microphone_available = True
        
        if VOSK_AVAILABLE:
            # Default model paths
            if model_path is None:
                if language == "hi":
                    model_path = "/home/pi/vosk-models/vosk-model-small-hi-0.22"
                else:
                    model_path = "/home/pi/vosk-models/vosk-model-small-en-us-0.15"
            
            if os.path.exists(model_path):
                try:
                    self.model = vosk.Model(model_path)
                    self.recognizer = vosk.KaldiRecognizer(self.model, sample_rate)
                    print(f"[STT] Vosk initialized with {language} model")
                except Exception as e:
                    print(f"[STT ERROR] Failed to load model: {e}")
            else:
                print(f"[STT WARNING] Model not found at {model_path}")
                print("Download models from: https://alphacephei.com/vosk/models")
        else:
            print("[STT] Running in simulation mode")
    
    def listen(self, timeout=5, retries=2):
        """
        Listen for speech and convert to text with retry logic.
        
        Args:
            timeout: Maximum listening duration in seconds
            retries: Number of retry attempts on failure
            
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
        
        if not VOSK_AVAILABLE or self.recognizer is None:
            # Fallback to Google Speech Recognition if available
            try:
                import speech_recognition as sr
                return self._listen_google(timeout, retries)
            except ImportError:
                # Simulation mode
                print("[STT SIMULATION] Listening...")
                import time
                time.sleep(1)
                return None  # Return None instead of simulated text
        
        print("[STT] Listening... (speak now)")
        
        audio_queue = queue.Queue()
        
        def audio_callback(indata, frames, time, status):
            if status:
                print(f"[STT] Audio status: {status}")
            audio_queue.put(bytes(indata))
        
        try:
            with sd.RawInputStream(
                samplerate=self.sample_rate,
                blocksize=8000,
                dtype='int16',
                channels=1,
                callback=audio_callback,
                device=self.device_index
            ):
                print("[STT] Recording...")
                
                import time
                start_time = time.time()
                
                while time.time() - start_time < timeout:
                    data = audio_queue.get()
                    
                    if self.recognizer.AcceptWaveform(data):
                        result = json.loads(self.recognizer.Result())
                        text = result.get('text', '')
                        
                        if text:
                            print(f"[STT] Recognized: {text}")
                            # Reset failure counter on success
                            self.consecutive_failures = 0
                            self.microphone_available = True
                            return text
                
                # Get final result
                final_result = json.loads(self.recognizer.FinalResult())
                text = final_result.get('text', '')
                
                if text:
                    print(f"[STT] Final: {text}")
                    # Reset failure counter on success
                    self.consecutive_failures = 0
                    self.microphone_available = True
                    return text
                else:
                    print("[STT] No speech detected")
                    return None
                    
        except Exception as e:
            print(f"[STT ERROR] {e}")
            self.consecutive_failures += 1
            if self.consecutive_failures >= self.max_consecutive_failures:
                self.microphone_available = False
                print(f"[STT] Circuit breaker activated after {self.consecutive_failures} failures")
            return None
    
    def _listen_google(self, timeout=5, retries=2):
        """
        Fallback to Google Speech Recognition with retry logic.
        
        Args:
            timeout: Maximum listening duration
            retries: Number of retry attempts
            
        Returns:
            str: Recognized text or None
        """
        import speech_recognition as sr
        
        recognizer = sr.Recognizer()
        # Fixed threshold for consistent recognition
        recognizer.energy_threshold = 400  # Higher threshold reduces false triggers
        recognizer.dynamic_energy_threshold = False  # Disable auto-adjustment for stability
        recognizer.pause_threshold = 0.8  # Seconds of silence to consider end of phrase
        recognizer.operation_timeout = None  # No timeout for operation
        
        for attempt in range(retries + 1):
            mic = None
            try:
                # Create microphone instance
                mic = sr.Microphone(device_index=self.device_index)
                
                # Open the microphone stream manually for better error handling
                with mic as source:
                    if attempt == 0:
                        # Brief ambient noise adjustment (only once)
                        print("[STT] Calibrating microphone...")
                        recognizer.adjust_for_ambient_noise(source, duration=0.3)
                        # After adjustment, restore fixed threshold
                        recognizer.energy_threshold = 400
                        recognizer.dynamic_energy_threshold = False
                    
                    print(f"[STT] Listening... (speak now)")
                    try:
                        audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=timeout)
                    except sr.WaitTimeoutError:
                        print("[STT] No speech detected (timeout)")
                        return None
                    
                    # Try recognition with shorter timeout
                    try:
                        text = recognizer.recognize_google(audio, language=self.language)
                        print(f"[STT] Recognized: {text}")
                        # Reset failure counter on success
                        self.consecutive_failures = 0
                        self.microphone_available = True
                        return text
                    except sr.UnknownValueError:
                        print("[STT] Could not understand audio")
                        return None
                    except sr.RequestError as e:
                        # Network/API error - retry
                        if attempt < retries:
                            print(f"[STT ERROR] API error (attempt {attempt + 1}/{retries + 1}): {e}")
                            print("[STT] Retrying...")
                            import time
                            time.sleep(0.5)  # Brief pause before retry
                            continue
                        else:
                            print(f"[STT ERROR] API failed after {retries + 1} attempts: {e}")
                            return None
                            
            except AttributeError as e:
                # Handle the 'NoneType' object has no attribute 'close' error
                if "'NoneType' object has no attribute 'close'" in str(e):
                    print(f"[STT ERROR] Microphone stream initialization failed. Retrying...")
                    self.consecutive_failures += 1
                    import time
                    time.sleep(1)  # Wait before retry
                    if attempt < retries:
                        continue
                    else:
                        if self.consecutive_failures >= self.max_consecutive_failures:
                            self.microphone_available = False
                            print(f"[STT ERROR] Circuit breaker activated after {self.consecutive_failures} failures")
                        else:
                            print("[STT ERROR] Microphone not available after multiple attempts")
                        return None
                else:
                    raise  # Re-raise if it's a different AttributeError
                    
            except Exception as e:
                error_msg = str(e)
                # Check for the specific close() error
                if "close" in error_msg.lower() and "NoneType" in error_msg:
                    print(f"[STT ERROR] Microphone stream error: {e}")
                    self.consecutive_failures += 1
                    import time
                    time.sleep(1)
                    if attempt < retries:
                        continue
                    else:
                        if self.consecutive_failures >= self.max_consecutive_failures:
                            self.microphone_available = False
                            print(f"[STT ERROR] Circuit breaker activated after {self.consecutive_failures} failures")
                        else:
                            print("[STT ERROR] Persistent microphone issue. Please check your audio device.")
                        return None
                
                if attempt < retries:
                    print(f"[STT ERROR] Exception (attempt {attempt + 1}/{retries + 1}): {e}")
                    self.consecutive_failures += 1
                    import time
                    time.sleep(0.5)
                    continue
                else:
                    print(f"[STT ERROR] Failed after {retries + 1} attempts: {e}")
                    self.consecutive_failures += 1
                    if self.consecutive_failures >= self.max_consecutive_failures:
                        self.microphone_available = False
                        print(f"[STT ERROR] Circuit breaker activated after {self.consecutive_failures} failures")
                    return None
            
            finally:
                # Ensure cleanup
                if mic is not None:
                    try:
                        if hasattr(mic, 'stream') and mic.stream is not None:
                            mic.stream.close()
                    except:
                        pass  # Ignore cleanup errors
        
        return None
    
    def listen_continuous(self, callback, stop_event=None):
        """
        Continuous listening mode.
        
        Args:
            callback: Function to call with recognized text
            stop_event: threading.Event to stop listening
        """
        if not VOSK_AVAILABLE or self.recognizer is None:
            print("[STT] Continuous mode not available in simulation")
            return
        
        audio_queue = queue.Queue()
        
        def audio_callback(indata, frames, time, status):
            audio_queue.put(bytes(indata))
        
        print("[STT] Starting continuous listening...")
        
        with sd.RawInputStream(
            samplerate=self.sample_rate,
            blocksize=8000,
            dtype='int16',
            channels=1,
            callback=audio_callback,
            device=self.device_index
        ):
            while True:
                if stop_event and stop_event.is_set():
                    break
                
                data = audio_queue.get()
                
                if self.recognizer.AcceptWaveform(data):
                    result = json.loads(self.recognizer.Result())
                    text = result.get('text', '')
                    
                    if text:
                        callback(text)

if __name__ == "__main__":
    print("Testing Speech-to-Text...")
    
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
