# VideoSummarizerAI

VideoSummarizerAI is a powerful web application that automatically generates summaries from video content. It extracts key information from videos through audio transcription, text summarization, and visual keyframe extraction.

## Features

- **Video Upload**: Support for multiple video formats (MP4, AVI, MOV, MKV) with a 2GB file size limit
- **Audio Transcription**: AI-powered transcription of video audio using OpenAI's Whisper model
- **Text Summarization**: Automatic summarization of transcribed content using Facebook's BART model
- **Visual Summary**: Extraction of key frames to provide visual context of the video
- **Responsive UI**: Modern, responsive interface built with React and TailwindCSS

## Architecture

The application consists of two main components:

### Backend (Python Flask)

- RESTful API for video processing and analysis
- AI model integration for transcription and summarization
- File management for uploads and key frames
- Error handling and logging

### Frontend (React)

- Modern UI built with React 19
- Styling with TailwindCSS
- File upload interface with progress tracking
- Summary display with transcription and key frames

## Installation

### Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm/yarn
- FFmpeg (for audio extraction)

### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/videosummarizerai.git
   cd videosummarizerai
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server
   ```bash
   python app.py
   ```

The backend will run on `http://localhost:5100`.

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`.

## API Endpoints

- `POST /api/upload`: Upload a video file
- `GET /api/summarize/<filename>`: Process a video and generate a summary
- `GET /api/frames/<frame_name>`: Get a specific keyframe image
- `GET /api/health`: Check service health status

## Technical Details

### Backend Components

- **Flask**: Lightweight web framework for Python
- **OpenAI Whisper**: State-of-the-art speech recognition model
- **Facebook BART**: Transformer-based text summarization model
- **OpenCV**: Computer vision library for key frame extraction
- **MoviePy/FFmpeg**: Video processing libraries for audio extraction

### Frontend Components

- **React 19**: JavaScript library for building user interfaces
- **TailwindCSS 4**: Utility-first CSS framework
- **Axios**: Promise-based HTTP client
- **Vite**: Modern frontend build tool

## Error Handling

The application includes comprehensive error handling for:
- File upload issues
- Audio extraction failures (with fallback methods)
- Transcription errors
- Model loading problems
- Memory management

## Acknowledgments

- OpenAI for the Whisper model
- Facebook Research for the BART model
- The open-source community for their valuable contributions
