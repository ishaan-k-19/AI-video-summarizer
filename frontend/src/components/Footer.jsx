const Footer = () => {
    return (
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">Video Summarizer AI</p>
          <p className="text-gray-400 text-sm">
            Powered by AI • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    )
  }
  
  export default Footer