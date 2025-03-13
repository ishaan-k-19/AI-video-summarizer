import { useState } from 'react';
import { FaExpandAlt, FaCompressAlt, FaTimes, FaCopy } from 'react-icons/fa';

const SummarySection = ({ summary }) => {
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  
  const openImagePopup = (imageUrl) => {
    setSelectedImage(imageUrl);
  };
  
  const closeImagePopup = () => {
    setSelectedImage(null);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'summary') {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } else {
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="card bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="h-6 w-1 bg-blue-600 mr-2"></span>
            Summary
          </h2>
          <button 
            onClick={() => copyToClipboard(summary.summary, 'summary')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            title="Copy summary to clipboard"
          >
            <FaCopy className="mr-1" />
            <span className="text-sm">{copiedSummary ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
      </div>
      
      <div className="card bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <span className="h-6 w-1 bg-blue-600 mr-2"></span>
          Key Frames
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {summary.key_frames.map((frame, index) => (
            <div 
              key={index} 
              className="overflow-hidden rounded-lg shadow-sm cursor-pointer" 
              onClick={() => openImagePopup(`http://localhost:5100/api/frames/${frame}`)}
            >
              <img 
                src={`http://localhost:5100/api/frames/${frame}`} 
                alt={`Key frame ${index + 1}`}
                className="w-full h-48 object-cover hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="card bg-white rounded-lg shadow-md p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="h-6 w-1 bg-blue-600 mr-2"></span>
            Transcript
          </h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => copyToClipboard(summary.transcription, 'transcript')}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              title="Copy transcript to clipboard"
            >
              <FaCopy className="mr-1" />
              <span className="text-sm">{copiedTranscript ? 'Copied!' : 'Copy'}</span>
            </button>
            <button 
              onClick={() => setShowFullTranscript(!showFullTranscript)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              {showFullTranscript ? (
                <>
                  <FaCompressAlt className="mr-1" /> <span className="text-sm">Collapse</span>
                </>
              ) : (
                <>
                  <FaExpandAlt className="mr-1" /> <span className="text-sm">Expand</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className={`bg-gray-50 rounded-lg p-4 overflow-auto ${showFullTranscript ? 'max-h-none' : 'max-h-60'}`}>
          <p className="text-gray-700 whitespace-pre-line">{summary.transcription}</p>
        </div>
        
        {!showFullTranscript && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Image Popup Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button 
              onClick={closeImagePopup}
              className="absolute -top-10 right-0 text-white p-2 hover:text-gray-300"
            >
              <FaTimes size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Enlarged key frame" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SummarySection;