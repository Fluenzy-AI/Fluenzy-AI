"""
Company Tracks - Real-time Video Analysis Backend
FastAPI server with WebSocket support for YOLOv8 object detection
"""

import asyncio
import base64
import json
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import behavioral analysis module
from behavioral_analysis import BehavioralAnalyzer, BehavioralMetrics, AnalysisResult


# Detection classes (COCO dataset subset)
DETECTION_CLASSES = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    4: "airplane",
    5: "bus",
    6: "train",
    7: "truck",
    8: "boat",
    9: "traffic light",
    10: "fire hydrant",
    11: "stop sign",
    12: "parking meter",
    13: "bench",
    14: "bird",
    15: "cat",
    16: "dog",
    17: "horse",
    18: "sheep",
    19: "cow",
    20: "elephant",
    21: "bear",
    22: "zebra",
    23: "giraffe",
    24: "backpack",
    25: "umbrella",
    26: "handbag",
    27: "tie",
    28: "suitcase",
    29: "frisbee",
    30: "skis",
    31: "snowboard",
    32: "sports ball",
    33: "kite",
    34: "baseball bat",
    35: "baseball glove",
    36: "skateboard",
    37: "surfboard",
    38: "tennis racket",
    39: "bottle",
    40: "wine glass",
    41: "cup",
    42: "fork",
    43: "knife",
    44: "spoon",
    45: "bowl",
    46: "banana",
    47: "apple",
    48: "sandwich",
    49: "orange",
    50: "broccoli",
    51: "carrot",
    52: "hot dog",
    53: "pizza",
    54: "donut",
    55: "cake",
    56: "chair",
    57: "couch",
    58: "potted plant",
    59: "bed",
    60: "dining table",
    61: "toilet",
    62: "tv",
    63: "laptop",
    64: "mouse",
    65: "remote",
    66: "keyboard",
    67: "cell phone",
    68: "microwave",
    69: "oven",
    70: "toaster",
    71: "sink",
    72: "refrigerator",
    73: "book",
    74: "clock",
    75: "vase",
    76: "scissors",
    77: "teddy bear",
    78: "hair drier",
    79: "toothbrush",
}

# Target classes for company tracking
TARGET_CLASSES = {
    "person": 0,
    "car": 2,
    "truck": 8,
    "bus": 5,
    "cell phone": 67,
    "laptop": 63,
    "book": 73,
}

# Alert types
ALERT_TYPES = {
    "PHONE_DETECTED": "Phone detected in restricted zone",
    "NO_FACE": "No face detected",
    "MULTIPLE_PERSONS": "Multiple persons detected in frame",
    "SUSPICIOUS_MOVEMENT": "Suspicious movement detected",
    "PHONE_USAGE": "Phone usage detected",
    "NO_PERSON": "No person detected",
    "HIGH_CONFIDENCE": "High confidence detection",
}


class DetectionResult(BaseModel):
    """Detection result model"""
    class_id: int
    class_name: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]


class FrameAnalysis(BaseModel):
    """Frame analysis result"""
    frame_id: str
    timestamp: float
    detections: List[DetectionResult]
    total_objects: int
    person_count: int
    phone_count: int
    vehicle_count: int
    alerts: List[str]
    processing_time_ms: float


class AnalyticsData(BaseModel):
    """Analytics data model"""
    session_id: str
    start_time: float
    total_frames: int
    total_detections: int
    peak_person_count: int
    peak_phone_count: int
    alert_history: List[Dict]
    detection_history: List[Dict]


class ConnectionManager:
    """WebSocket connection manager"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_data: Dict[str, AnalyticsData] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
        # Initialize session
        self.session_data[client_id] = AnalyticsData(
            session_id=client_id,
            start_time=time.time(),
            total_frames=0,
            total_detections=0,
            peak_person_count=0,
            peak_phone_count=0,
            alert_history=[],
            detection_history=[],
        )
        
        print(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.session_data:
            del self.session_data[client_id]
        print(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def send_frame_result(self, client_id: str, result: FrameAnalysis):
        await self.send_message(client_id, {
            "type": "detection_result",
            "data": result.dict()
        })


# Global state
manager = ConnectionManager()


def load_yolo_model():
    """Load YOLOv8 model"""
    try:
        from ultralytics import YOLO
        # Load YOLOv8n model (nano - fastest)
        model = YOLO("yolov8n.pt")
        print("YOLOv8 model loaded successfully")
        return model
    except Exception as e:
        print(f"Error loading YOLO model: {e}")
        return None


def draw_detections(frame: np.ndarray, detections: List[DetectionResult]) -> np.ndarray:
    """Draw bounding boxes and labels on frame"""
    result_frame = frame.copy()
    
    for det in detections:
        x1, y1, x2, y2 = det.bbox
        
        # Choose color based on class
        if det.class_name == "person":
            color = (0, 255, 0)  # Green
        elif det.class_name == "cell phone":
            color = (255, 0, 255)  # Magenta
        elif det.class_name in ["car", "truck", "bus"]:
            color = (255, 255, 0)  # Cyan
        else:
            color = (0, 255, 255)  # Yellow
        
        # Draw rectangle
        cv2.rectangle(result_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
        
        # Draw label
        label = f"{det.class_name}: {det.confidence:.2f}"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        cv2.rectangle(result_frame, (int(x1), int(y1) - label_size[1] - 4), 
                     (int(x1) + label_size[0], int(y1)), color, -1)
        cv2.putText(result_frame, label, (int(x1), int(y1) - 2), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
    
    return result_frame


def process_frame(frame: np.ndarray, model, client_id: str) -> FrameAnalysis:
    """Process a single frame with YOLO"""
    start_time = time.time()
    frame_id = str(uuid.uuid4())
    
    detections = []
    alerts = []
    person_count = 0
    phone_count = 0
    vehicle_count = 0
    
    try:
        # Run inference
        results = model(frame, verbose=False, conf=0.3, iou=0.5)
        
        if results and len(results) > 0:
            result = results[0]
            
            if result.boxes is not None:
                boxes = result.boxes
                
                for i in range(len(boxes)):
                    box = boxes[i]
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # Get class name
                    class_name = DETECTION_CLASSES.get(class_id, f"unknown_{class_id}")
                    
                    # Get bounding box
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    detection = DetectionResult(
                        class_id=class_id,
                        class_name=class_name,
                        confidence=confidence,
                        bbox=[x1, y1, x2, y2]
                    )
                    detections.append(detection)
                    
                    # Count specific objects
                    if class_name == "person":
                        person_count += 1
                    elif class_name == "cell phone":
                        phone_count += 1
                    elif class_name in ["car", "truck", "bus"]:
                        vehicle_count += 1
    
    except Exception as e:
        print(f"Error processing frame: {e}")
    
    # Generate alerts
    if person_count > 1:
        alerts.append("MULTIPLE_PERSONS")
    if person_count == 0:
        alerts.append("NO_PERSON")
    if phone_count > 0:
        alerts.append("PHONE_DETECTED")
    
    # Update session analytics
    if client_id in manager.session_data:
        session = manager.session_data[client_id]
        session.total_frames += 1
        session.total_detections += len(detections)
        session.peak_person_count = max(session.peak_person_count, person_count)
        session.peak_phone_count = max(session.peak_phone_count, phone_count)
        
        if alerts:
            session.alert_history.append({
                "timestamp": time.time(),
                "alerts": alerts,
                "person_count": person_count,
                "phone_count": phone_count
            })
        
        session.detection_history.append({
            "timestamp": time.time(),
            "person_count": person_count,
            "phone_count": phone_count,
            "vehicle_count": vehicle_count,
            "total_objects": len(detections)
        })
    
    processing_time = (time.time() - start_time) * 1000
    
    return FrameAnalysis(
        frame_id=frame_id,
        timestamp=time.time(),
        detections=detections,
        total_objects=len(detections),
        person_count=person_count,
        phone_count=phone_count,
        vehicle_count=vehicle_count,
        alerts=alerts,
        processing_time_ms=processing_time
    )


def decode_base64_image(image_data: str) -> Optional[np.ndarray]:
    """Decode base64 image to numpy array"""
    try:
        # Remove data URL prefix if present
        if "data:image" in image_data:
            image_data = image_data.split(",")[1]
        
        # Decode base64
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return frame
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None


def encode_base64_image(frame: np.ndarray) -> str:
    """Encode numpy array to base64"""
    try:
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buffer).decode("utf-8")
    except Exception as e:
        print(f"Error encoding image: {e}")
        return ""


# Global model (loaded lazily)
yolo_model = None

# Global behavioral analyzer (loaded lazily in websocket)
# behavioral_analyzer = BehavioralAnalyzer()  # REMOVED - causes OOM on free tier


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager - lightweight startup for Render free tier"""
    global yolo_model
    print("Starting Company Tracks Video Analysis Server (lazy loading enabled)...")
    # DON'T load models at startup - this causes OOM on free tier
    # Models will be loaded lazily on first request
    yield
    print("Shutting down server...")


# Create FastAPI app
app = FastAPI(
    title="Company Tracks API",
    description="Real-time video analysis with YOLOv8",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Company Tracks Video Analysis",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "websocket": "/ws/{client_id}",
            "health": "/health",
            "analytics": "/analytics/{session_id}"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": yolo_model is not None,
        "active_connections": len(manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/analytics/{session_id}")
async def get_analytics(session_id: str):
    """Get analytics for a session"""
    if session_id not in manager.session_data:
        return {"error": "Session not found"}, 404
    
    session = manager.session_data[session_id]
    
    return {
        "session_id": session.session_id,
        "duration_seconds": time.time() - session.start_time,
        "total_frames": session.total_frames,
        "total_detections": session.total_detections,
        "peak_person_count": session.peak_person_count,
        "peak_phone_count": session.peak_phone_count,
        "alert_count": len(session.alert_history),
        "alerts": session.alert_history[-50:],  # Last 50 alerts
        "detection_history": session.detection_history[-100:]  # Last 100 detections
    }


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time video analysis"""
    await manager.connect(websocket, client_id)
    
    try:
        # Send welcome message
        await manager.send_message(client_id, {
            "type": "connected",
            "session_id": client_id,
            "message": "Connected to Company Tracks Video Analysis"
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "frame":
                    # Process video frame
                    image_data = message.get("image")
                    
                    if image_data:
                        frame = decode_base64_image(image_data)
                        
                        if frame is not None and yolo_model is not None:
                            # Process frame
                            result = process_frame(frame, yolo_model, client_id)
                            
                            # Draw detections on frame
                            annotated_frame = draw_detections(frame, result.detections)
                            
                            # Send result with annotated frame
                            await manager.send_message(client_id, {
                                "type": "detection_result",
                                "data": {
                                    "frame_id": result.frame_id,
                                    "timestamp": result.timestamp,
                                    "detections": [
                                        {
                                            "class_id": d.class_id,
                                            "class_name": d.class_name,
                                            "confidence": d.confidence,
                                            "bbox": d.bbox
                                        }
                                        for d in result.detections
                                    ],
                                    "total_objects": result.total_objects,
                                    "person_count": result.person_count,
                                    "phone_count": result.phone_count,
                                    "vehicle_count": result.vehicle_count,
                                    "alerts": result.alerts,
                                    "processing_time_ms": result.processing_time,
                                    "annotated_frame": encode_base64_image(annotated_frame)
                                }
                            })
                        else:
                            await manager.send_message(client_id, {
                                "type": "error",
                                "message": "Failed to process frame or model not loaded"
                            })
                
                elif message_type == "ping":
                    await manager.send_message(client_id, {
                        "type": "pong",
                        "timestamp": time.time()
                    })
                
                elif message_type == "get_analytics":
                    if client_id in manager.session_data:
                        session = manager.session_data[client_id]
                        await manager.send_message(client_id, {
                            "type": "analytics",
                            "data": {
                                "total_frames": session.total_frames,
                                "total_detections": session.total_detections,
                                "peak_person_count": session.peak_person_count,
                                "peak_phone_count": session.peak_phone_count,
                                "alert_count": len(session.alert_history)
                            }
                        })
                
                elif message_type == "reset_session":
                    if client_id in manager.session_data:
                        session = manager.session_data[client_id]
                        session.total_frames = 0
                        session.total_detections = 0
                        session.peak_person_count = 0
                        session.peak_phone_count = 0
                        session.alert_history = []
                        session.detection_history = []
                    
                    await manager.send_message(client_id, {
                        "type": "session_reset",
                        "message": "Session analytics reset"
                    })
                    
                else:
                    await manager.send_message(client_id, {
                        "type": "error",
                        "message": f"Unknown message type: {message_type}"
                    })
                    
            except json.JSONDecodeError:
                await manager.send_message(client_id, {
                    "type": "error",
                    "message": "Invalid JSON"
                })
            except Exception as e:
                await manager.send_message(client_id, {
                    "type": "error",
                    "message": str(e)
                })
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        print(f"Client {client_id} disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(client_id)


import os

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)


# ============================================
# Behavioral Analysis WebSocket Endpoint
# ============================================


class BehavioralRoomManager:
    """WebSocket room connection manager for behavioral analysis"""
    
    def __init__(self):
        # Maps session_id to a list of WebSockets
        self.rooms: Dict[str, List[WebSocket]] = {}
        # Maps session_id to a single BehavioralAnalyzer
        self.analyzers: Dict[str, BehavioralAnalyzer] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.rooms:
            self.rooms[session_id] = []
            self.analyzers[session_id] = BehavioralAnalyzer()
        self.rooms[session_id].append(websocket)
        print(f"[BehavioralRoomManager] Connected {websocket.client} to session {session_id}. Total room connections: {len(self.rooms[session_id])}")
        
    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.rooms:
            if websocket in self.rooms[session_id]:
                self.rooms[session_id].remove(websocket)
            if not self.rooms[session_id]:
                del self.rooms[session_id]
                if session_id in self.analyzers:
                    del self.analyzers[session_id]
        print(f"[BehavioralRoomManager] Disconnected client from session {session_id}.")
        
    def get_analyzer(self, session_id: str) -> BehavioralAnalyzer:
        if session_id not in self.analyzers:
            self.analyzers[session_id] = BehavioralAnalyzer()
        return self.analyzers[session_id]
        
    async def broadcast(self, session_id: str, message: dict):
        if session_id in self.rooms:
            connections = list(self.rooms[session_id])
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    print(f"[BehavioralRoomManager] Error broadcasting to connection in session {session_id}: {e}")

behavioral_room_manager = BehavioralRoomManager()


@app.websocket("/ws/behavioral/{session_id}")
async def websocket_behavioral_analysis(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time behavioral analysis
    
    This endpoint provides:
    - Face mesh landmark detection
    - Pose detection for posture analysis
    - Eye contact scoring
    - Smile detection
    - Stress level detection
    - Head stability tracking
    - Engagement scoring
    
    Optimization features:
    - Frame dropping: Only processes the most recent frame if backend is busy
    - Backpressure: Notifies frontend when overloaded
    """
    await behavioral_room_manager.connect(websocket, session_id)
    
    # Create / get session-specific analyzer
    session_analyzer = behavioral_room_manager.get_analyzer(session_id)
    
    # Frame dropping: Use asyncio primitives for thread-safe state
    is_processing = False
    pending_frame = None
    pending_frame_lock = asyncio.Lock()
    last_frame_id = 0
    dropped_frames = 0
    
    async def process_frame_task(image_data: str, frame_id: int):
        """Process a single frame in the background."""
        nonlocal is_processing, dropped_frames
        
        try:
            frame = decode_base64_image(image_data)
            
            if frame is not None:
                # Analyze frame
                result = session_analyzer.analyze_frame(frame, session_id)
                
                # Broadcast result to all connections in the room
                await behavioral_room_manager.broadcast(session_id, {
                    "type": "behavioral_result",
                    "data": {
                        "frame_id": result.frame_id,
                        "timestamp": result.timestamp,
                        "metrics": {
                            "confidence": result.metrics.confidence,
                            "eye_contact": result.metrics.eye_contact,
                            "posture": result.metrics.posture,
                            "engagement": result.metrics.engagement,
                            "smile": result.metrics.smile,
                            "head_stability": result.metrics.head_stability,
                            "stress_level": result.metrics.stress_level,
                            "filler_word_count": result.metrics.filler_word_count,
                            "face_detected": result.metrics.face_detected,
                            "alerts": result.metrics.alerts
                        },
                        "pose_landmarks": [
                            {"x": lm[0], "y": lm[1], "z": lm[2]} 
                            for lm in result.pose_landmarks
                        ][:33],
                        "face_landmarks": [
                            {"x": lm[0], "y": lm[1], "z": lm[2]} 
                            for lm in result.face_landmarks
                        ][:468],
                        "processing_time_ms": result.processing_time_ms,
                        "annotated_frame": result.annotated_frame
                    }
                })
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": "Failed to decode frame"
                })
        except Exception as e:
            print(f"Error processing frame: {e}")
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        finally:
            is_processing = False
    
    print(f"Behavioral analysis session started for: {session_id}")
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "Connected to Behavioral Analysis System",
            "features": [
                "face_landmarks",
                "pose_detection",
                "eye_contact_scoring",
                "posture_analysis",
                "smile_detection",
                "stress_detection",
                "engagement_scoring"
            ]
        })
        
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "frame":
                    # Process video frame for behavioral analysis
                    image_data = message.get("image")
                    frame_id = message.get("frame_id", 0)
                    
                    if image_data:
                        async with pending_frame_lock:
                            # Frame dropping: Replace pending frame with newest
                            if is_processing:
                                dropped_frames += 1
                                print(f"⚠️ Frame {last_frame_id} dropped, now queuing {frame_id}. Total dropped: {dropped_frames}")
                                
                                # Notify frontend about backpressure
                                try:
                                    await websocket.send_json({
                                        "type": "busy",
                                        "frame_id": frame_id,
                                        "dropped": dropped_frames
                                    })
                                except:
                                    pass
                            
                            # Store new frame as pending
                            pending_frame = image_data
                            last_frame_id = frame_id
                            
                            # If not currently processing, start processing
                            if not is_processing:
                                is_processing = True
                                # Create task to process in background (non-blocking)
                                asyncio.create_task(process_frame_task(pending_frame, frame_id))
                                pending_frame = None
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "No image data provided"
                        })
                
                elif message_type == "audio":
                    # Process audio/transcript for filler word detection
                    transcript = message.get("transcript", "")
                    is_speaking = message.get("is_speaking", False)
                    
                    audio_result = session_analyzer.process_audio(transcript, is_speaking)
                    
                    # Broadcast audio result and transcript to the room
                    await behavioral_room_manager.broadcast(session_id, {
                        "type": "audio_result",
                        "data": {
                            "filler_words": audio_result.get("filler_words", 0),
                            "filler_list": audio_result.get("filler_list", []),
                            "speaking_rate": audio_result.get("speaking_rate", 0),
                            "transcript": transcript,
                            "is_speaking": is_speaking
                        }
                    })
                
                elif message_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": time.time()
                    })
                
                elif message_type == "get_summary":
                    # Get session summary
                    summary = session_analyzer.get_session_summary()
                    await websocket.send_json({
                        "type": "session_summary",
                        "data": summary
                    })
                
                elif message_type == "reset":
                    # Reset session analyzer
                    session_analyzer = behavioral_room_manager.get_analyzer(session_id)
                    await websocket.send_json({
                        "type": "reset_complete",
                        "message": "Session analysis reset"
                    })
                
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message_type}"
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error", 
                    "message": "Invalid JSON"
                })
            except Exception as e:
                print(f"Error processing message: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except WebSocketDisconnect:
        behavioral_room_manager.disconnect(websocket, session_id)
        print(f"Behavioral analysis session ended for: {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        behavioral_room_manager.disconnect(websocket, session_id)


# Health check for behavioral analysis
@app.get("/health/behavioral")
async def health_check_behavioral():
    """Health check for behavioral analysis"""
    return {
        "status": "healthy",
        "behavioral_endpoint_available": True,
        "timestamp": datetime.now().isoformat()
    }
