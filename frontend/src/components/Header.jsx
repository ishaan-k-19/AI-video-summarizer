import { FaVideo } from 'react-icons/fa'

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center">
          <FaVideo className="text-3xl mr-3" />
          <div className="text-center">
            <h1 className="text-3xl font-bold">AI Video Summarizer</h1>
            <p className="mt-2 text-blue-100">Upload a video and get an AI-powered summary instantly</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header