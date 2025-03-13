import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import time
from werkzeug.utils import secure_filename
from transformers import pipeline
from moviepy.editor import VideoFileClip
import logging
import tempfile
import subprocess
import gc
from concurrent.futures import ThreadPoolExecutor


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 2000 * 1024 * 1024  # 500MB max upload size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

summarizer = None
transcriber = None

# Thread pool for parallel processing
executor = ThreadPoolExecutor(max_workers=4)

def load_summarizer():
    global summarizer
    if summarizer is None:
        logger.info("Loading summarization model...")
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    return summarizer

def load_transcriber():
    global transcriber
    if transcriber is None:
        logger.info("Loading transcription model...")
        transcriber = pipeline("automatic-speech-recognition", model="openai/whisper-small")  # Use smaller model for speed
    return transcriber

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_audio_moviepy(video_path):
    """Extract audio using MoviePy with improved error handling"""
    try:
        logger.info(f"Extracting audio from {video_path} using MoviePy")
        audio_path = os.path.join(tempfile.gettempdir(), f"audio_{int(time.time())}.wav")
        
        # Load video
        try:
            video = VideoFileClip(video_path)
        except Exception as e:
            logger.error(f"Failed to load video with MoviePy: {e}")
            return None
            
        # Check if video has audio
        if video.audio is None:
            logger.warning(f"Video {video_path} does not have an audio track")
            video.close()
            return None
            
        # Extract audio
        try:
            video.audio.write_audiofile(
                audio_path, 
                codec='pcm_s16le', 
                verbose=False, 
                logger=None
            )
            video.close()
            
            # Verify the audio file exists and has content
            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                return audio_path
            else:
                logger.error(f"Audio extraction produced empty file: {audio_path}")
                return None
                
        except Exception as e:
            logger.error(f"Error writing audio file: {e}")
            video.close()
            return None
            
    except Exception as e:
        logger.error(f"Error in audio extraction: {e}")
        return None

def fallback_audio_extraction(video_path):
    """Use subprocess to call ffmpeg directly if available"""
    try:
        logger.info(f"Trying fallback audio extraction for {video_path}")
        audio_path = os.path.join(tempfile.gettempdir(), f"audio_fallback_{int(time.time())}.wav")
        
        # Check if ffmpeg is available
        try:
            subprocess.run(['ffmpeg', '-version'], 
                          stdout=subprocess.PIPE, 
                          stderr=subprocess.PIPE, 
                          check=True)
        except (subprocess.SubprocessError, FileNotFoundError):
            logger.warning("FFmpeg not available for fallback extraction")
            return None
            
        # Try to extract audio with ffmpeg
        command = [
            'ffmpeg', 
            '-i', video_path, 
            '-vn',  # No video
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',  # Mono
            '-y',  # Overwrite output
            audio_path
        ]
        
        process = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        if process.returncode != 0:
            logger.error(f"FFmpeg subprocess error: {process.stderr.decode()}")
            return None
            
        if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
            return audio_path
        else:
            logger.error("Fallback audio extraction produced empty file")
            return None
            
    except Exception as e:
        logger.error(f"Error in fallback audio extraction: {e}")
        return None
    
def transcribe_audio(audio_path):
    """Use Whisper model to transcribe audio to text"""
    try:
        logger.info(f"Transcribing audio from {audio_path}")
        
        if not os.path.exists(audio_path):
            logger.error(f"Audio file not found: {audio_path}")
            return "Audio file not found."
            
        # Load the transcriber
        transcriber = load_transcriber()
        
        # Transcribe the audio with timestamps
        transcription = transcriber(audio_path, return_timestamps=True)
        logger.info(f"Raw transcription result: {transcription}")
        
        if isinstance(transcription, dict) and "text" in transcription:
            return transcription["text"]
        elif isinstance(transcription, list) and len(transcription) > 0:
            return " ".join([chunk["text"] for chunk in transcription if "text" in chunk])
        else:
            return "Unexpected transcription format."
        
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return f"Failed to transcribe audio: {str(e)}"

def generate_summary(text):
    """Generate summary from transcribed text"""
    try:
        logger.info("Generating summary from transcribed text")
        if not text or len(text.strip()) < 50:
            logger.warning(f"Text too short for summarization: '{text}'")
            return "Text too short or empty for summarization."
            
        # Load the summarizer
        summarizer = load_summarizer()
        
        # Break text into chunks if too long
        max_length = 1024
        if len(text) > max_length:
            chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]
            summaries = []
            for chunk in chunks:
                if len(chunk.strip()) > 50:  # Only summarize chunks with enough content
                    summary = summarizer(chunk, max_length=150, min_length=30, do_sample=False)
                    summaries.append(summary[0]['summary_text'])
            return " ".join(summaries)
        else:
            summary = summarizer(text, max_length=150, min_length=30, do_sample=False)
            return summary[0]['summary_text']
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return f"Failed to generate summary: {str(e)}"

def extract_key_frames(video_path, max_frames=5):
    """Extract key frames from video for visual summary"""
    try:
        logger.info(f"Extracting key frames from {video_path}")
        video = cv2.VideoCapture(video_path)
        if not video.isOpened():
            logger.error(f"Failed to open video file: {video_path}")
            return []
            
        frames = []
        frame_count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if frame_count <= 0:
            logger.warning(f"Video has no frames: {video_path}")
            return []
        
        # Get evenly spaced frames
        step = max(1, frame_count // max_frames)
        
        for i in range(0, frame_count, step):
            video.set(cv2.CAP_PROP_POS_FRAMES, i)
            success, frame = video.read()
            if success:
                # Save frame as image with unique timestamp
                frame_filename = f"frame_{int(time.time())}_{i}.jpg"
                frame_path = os.path.join(app.config['UPLOAD_FOLDER'], frame_filename)
                cv2.imwrite(frame_path, frame)
                frames.append(frame_filename)
            
            if len(frames) >= max_frames:
                break
                
        video.release()
        return frames
    except Exception as e:
        logger.error(f"Error extracting key frames: {e}")
        return []

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            # Secure the filename and save the file
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            logger.info(f"File uploaded successfully: {filename}")
            
            # Return the file path for the next steps
            return jsonify({
                'status': 'success',
                'message': 'File uploaded successfully',
                'filename': filename
            }), 200
        
        return jsonify({'error': 'File type not allowed'}), 400
    except Exception as e:
        logger.error(f"Error in upload: {e}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/summarize/<filename>', methods=['GET'])
def summarize_video(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            return jsonify({'error': 'File not found'}), 404
        
        # Extract audio from video using primary method
        audio_path = extract_audio_moviepy(file_path)
        
        # Try fallback method if primary method fails
        if audio_path is None:
            logger.info("Primary audio extraction failed, trying fallback method")
            audio_path = fallback_audio_extraction(file_path)
        
        # Initialize results
        transcription = "No audio detected or extraction failed."
        summary = "Summary unavailable due to audio processing failure."
        
        if audio_path:
            # Transcribe audio to text
            transcription = transcribe_audio(audio_path)
            logger.info(f"Transcription complete: {len(transcription)} characters")
            
            # Clean up temporary audio file
            try:
                os.remove(audio_path)
                logger.info(f"Temporary audio file removed: {audio_path}")
            except Exception as e:
                logger.warning(f"Failed to remove temporary audio file: {e}")
            
            # Generate summary from transcription
            if transcription and not transcription.startswith("Failed to transcribe"):
                summary = generate_summary(transcription)
                logger.info(f"Summary generation complete: {len(summary)} characters")
        
        # Extract key frames for visual summary
        key_frames = extract_key_frames(file_path)
        
        # Create summary data
        summary_data = {
            'filename': filename,
            'transcription': transcription,
            'summary': summary,
            'key_frames': key_frames,
            'has_audio': audio_path is not None
        }
        
        # Clean up uploaded video file
        try:
            os.remove(file_path)
            logger.info(f"Uploaded video file removed: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to remove uploaded video file: {e}")
        
        return jsonify(summary_data), 200
        
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        return jsonify({'error': f'Error processing video: {str(e)}'}), 500

@app.route('/api/frames/<frame_name>', methods=['GET'])
def get_frame(frame_name):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], frame_name)
    except Exception as e:
        logger.error(f"Error serving frame: {e}")
        return jsonify({'error': f'Error serving frame: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'models': {
            'summarizer': summarizer is not None,
            'transcriber': transcriber is not None
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5100)