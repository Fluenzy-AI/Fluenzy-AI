"""
Text-to-Speech implementation
Supports:
1. Windows SAPI5 (via win32com) - Most reliable for Windows
2. pyttsx3 - Cross-platform fallback
3. eSpeak - Linux/Pi fallback
"""

import subprocess
import os
import threading
import time
from dotenv import load_dotenv
import sounddevice as sd
import numpy as np

# Load .env file
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir) # drishti_ai
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)

# Try importing win32com for direct SAPI5 access (Best for Windows)
try:
    import win32com.client
    import pythoncom
    WIN32_AVAILABLE = True
except ImportError:
    WIN32_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import stream, save
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False

class TextToSpeech:
    def __init__(self, engine="auto", rate=150, language="en"):
        """
        Initialize text-to-speech.
        """
        self.rate = rate
        self.language = language
        self.lock = threading.Lock()
        self.engine_type = "unknown"

        self.lock = threading.Lock()
        self.engine_type = "unknown"
        self.elevenlabs_client = None

        # 0. Try ElevenLabs (If configured and available)
        elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        if (engine == "auto" or engine == "elevenlabs") and ELEVENLABS_AVAILABLE and elevenlabs_key:
            try:
                self.elevenlabs_client = ElevenLabs(api_key=elevenlabs_key)
                self.engine_type = "elevenlabs"
                print("[TTS] Initialized ElevenLabs")
                return
            except Exception as e:
                print(f"[TTS] ElevenLabs Init failed: {e}")

        # 1. Try Windows SAPI5 Direct (Most Reliable on Windows)
        if engine == "auto" and WIN32_AVAILABLE:
            try:
                # Test credentials
                self.sapi_voice = win32com.client.Dispatch("SAPI.SpVoice")
                self.engine_type = "sapi5"
                print("[TTS] Initialized SAPI5 (Direct Windows Access)")
                
                # Set rate
                # SAPI rate is -10 to 10
                sapi_rate = int((rate - 150) / 10)
                sapi_rate = max(-10, min(10, sapi_rate))
                self.sapi_voice.Rate = sapi_rate
                
                # Try to find female voice
                try:
                    voices = self.sapi_voice.GetVoices()
                    for i in range(voices.Count):
                        voice = voices.Item(i)
                        desc = voice.GetDescription()
                        if 'zira' in desc.lower() or 'female' in desc.lower():
                            self.sapi_voice.Voice = voice
                            print(f"[TTS] Using voice: {desc}")
                            break
                except:
                    pass
                
                return
            except Exception as e:
                print(f"[TTS] SAPI5 Init failed: {e}")
        
        # 2. Try pyttsx3
        if (engine == "auto" or engine == "pyttsx3") and PYTTSX3_AVAILABLE:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', rate)
                self.engine_type = "pyttsx3"
                print("[TTS] Initialized pyttsx3")
                return
            except Exception as e:
                print(f"[TTS] pyttsx3 init failed: {e}")
        
        # 3. Fallback to eSpeak
        self.engine_type = "espeak"
        print("[TTS] Using eSpeak fallback")

    def speak(self, text, language=None):
        """Speak text using the initialized engine."""
        if not text:
            return
            
        print(f"[TTS] Speaking: {text}")
        
        with self.lock:
            try:
                if self.engine_type == "elevenlabs":
                    self._speak_elevenlabs(text)
                
                elif self.engine_type == "fallback":
                    # Use fallback (ElevenLabs failed, switched permanently)
                    self._fallback_to_local_tts(text)

                elif self.engine_type == "sapi5":
                    # Re-dispatch ensures thread safety in COM
                    pythoncom.CoInitialize()
                    speaker = win32com.client.Dispatch("SAPI.SpVoice")
                    
                    # Set voice again (COM objects might need refresh)
                    # For simplicity, we just speak with default or already configured context if possible
                    # But dispatch creates new instance. Let's just speak.
                    speaker.Rate = self.sapi_voice.Rate
                    speaker.Voice = self.sapi_voice.Voice
                    
                    speaker.Speak(text)
                    pythoncom.CoUninitialize()
                    
                elif self.engine_type == "pyttsx3":
                    self.engine.say(text)
                    self.engine.runAndWait()
                    
                else: # espeak
                    self._speak_espeak(text, language or self.language)
                    
            except Exception as e:
                print(f"[TTS ERROR] Speech failed: {e}")

    def _speak_elevenlabs(self, text):
        try:
            print(f"[TTS] Generating audio for: {text}")
            # Generate audio stream using PCM format for direct playback with sounddevice
            audio_stream = self.elevenlabs_client.text_to_speech.convert(
                text=text,
                voice_id="1zUSi8LeHs9M2mV8X6YS",   # Priyanka
                model_id="eleven_turbo_v2",      # FREE TIER
                output_format="pcm_22050",
                
                # 🎛️ VOICE SETTINGS (MATCHING USER UI)
                voice_settings={
                    "speed": 0.85,
                    "stability": 0.65,
                    "similarity_boost": 0.2,
                    "style": 0.05,
                    "use_speaker_boost": True
                }
            )

            # Open continuous audio output stream
            # 22050Hz, 1 channel, 16-bit PCM
            with sd.OutputStream(
                samplerate=22050,
                channels=1,
                dtype='int16'
            ) as stream:
                for chunk in audio_stream:
                    if chunk:
                        # Convert bytes to numpy array
                        audio = np.frombuffer(chunk, dtype=np.int16)
                        stream.write(audio)
                        
        except Exception as e:
            print(f"[TTS ERROR] ElevenLabs failed: {e}")
            print(f"[TTS] Permanently switching to local TTS (quota exhausted)")
            # PERMANENT SWITCH: Don't try ElevenLabs again
            self.engine_type = "fallback"
            self._fallback_to_local_tts(text)
    
    def _fallback_to_local_tts(self, text):
        """Fallback to local TTS when ElevenLabs fails."""
        # Try SAPI5 first (best for Windows)
        if WIN32_AVAILABLE:
            try:
                pythoncom.CoInitialize()
                speaker = win32com.client.Dispatch("SAPI.SpVoice")
                speaker.Speak(text)
                pythoncom.CoUninitialize()
                return
            except Exception as e:
                print(f"[TTS] SAPI5 fallback failed: {e}")
        
        # Try pyttsx3 next
        if PYTTSX3_AVAILABLE:
            try:
                if not hasattr(self, 'fallback_engine'):
                    self.fallback_engine = pyttsx3.init()
                    self.fallback_engine.setProperty('rate', self.rate)
                self.fallback_engine.say(text)
                self.fallback_engine.runAndWait()
                return
            except Exception as e:
                print(f"[TTS] pyttsx3 fallback failed: {e}")
        
        # Last resort: espeak
        self._speak_espeak(text, self.language)

    def _speak_espeak(self, text, language):
        try:
            lang_code = "hi" if language == "hi" else "en"
            cmd = ["espeak", "-v", lang_code, text]
            subprocess.run(cmd, check=True, capture_output=True)
        except Exception as e:
            print(f"[TTS ERROR] eSpeak failed: {e}")

if __name__ == "__main__":
    print("Testing TTS...")
    tts = TextToSpeech()
    tts.speak("Hello, checking 1 2 3")
    tts.speak("This is the second phrase to verify reliability.")
