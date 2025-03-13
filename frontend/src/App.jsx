import { useState } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import SummarySection from './components/SummarySection';
import Footer from './components/Footer';

function App() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <UploadSection 
          setSummary={setSummary} 
          setLoading={setLoading} 
          setError={setError} 
        />
        
        {loading && (
          <div className="my-8 p-6 bg-white rounded-lg shadow-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your video... This may take a few minutes</p>
          </div>
        )}
        
        {error && (
          <div className="my-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {summary && !loading && <SummarySection summary={summary} />}
      </main>
      <Footer />
    </div>
  );
}

export default App;