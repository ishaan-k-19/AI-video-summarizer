import { useState, useRef } from 'react';
import axios from 'axios';

const UploadSection = ({ setSummary, setLoading, setError }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      // Check if the dropped file is a video
      const fileType = droppedFile.type;
      if (fileType.startsWith('video/')) {
        setFile(droppedFile);
      } else {
        setError('Please drop a valid video file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setLoading(true);
    setIsProcessing(true);
    setProgress(0);
    setProcessingStage('Uploading');
    setError(null);
    setSummary(null);

    try {
      // Upload the file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post('http://localhost:5100/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const uploadPercentage = Math.round((progressEvent.loaded * 70) / progressEvent.total);
          setProgress(uploadPercentage);
        }
      });

      if (uploadResponse.status === 200) {
        setProcessingStage('Processing video');
        setProgress(70);

        // Fetch summary
        // Simulate progress for processing stage since the server doesn't provide real-time progress
        const processingInterval = setInterval(() => {
          setProgress(prevProgress => {
            const newProgress = prevProgress + 1;
            if (newProgress >= 95) {
              clearInterval(processingInterval);
              return 95;
            }
            return newProgress;
          });
        }, 500);

        const summaryResponse = await axios.get(
          `http://localhost:5100/api/summarize/${uploadResponse.data.filename}`
        );

        clearInterval(processingInterval);
        setProgress(100);
        setProcessingStage('Complete');
        setSummary(summaryResponse.data);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred during processing');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Your Video</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div 
          className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
                      rounded-lg p-6 text-center transition-colors duration-200`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            id="video-upload"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
          />
          <div className="cursor-pointer flex flex-col items-center justify-center space-y-2">
            <svg
              className={`h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-gray-600">
              {isDragging 
                ? 'Drop your video file here' 
                : isProcessing 
                  ? 'Processing...'
                  : 'Click or drag to upload a video file'}
            </span>
            <span className="text-xs text-gray-500">(MP4, AVI, MOV, MKV)</span>
          </div>
          {file && !isProcessing && (
            <div className="mt-3 text-sm text-blue-600">
              Selected: <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${
            isProcessing || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          disabled={isProcessing || !file}
        >
          {isProcessing ? 'Processing...' : 'Process Video'}
        </button>
      </form>

      {progress > 0 && progress < 100 && (
        <div className="mt-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-blue-600">{processingStage}</span>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;