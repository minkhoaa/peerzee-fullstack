export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#ECC8CD] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl min-h-[600px] bg-[#FDF0F1] rounded-[40px] shadow-2xl shadow-[#CD6E67]/20 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Panel - Illustration */}
        <div className="w-full lg:w-1/2 h-64 lg:h-auto bg-[#CD6E67] relative flex flex-col items-center justify-center p-10 text-center">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white"></div>
            <div className="absolute top-32 right-16 w-16 h-16 rounded-full bg-white"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-white"></div>
            <div className="absolute bottom-32 right-24 w-12 h-12 rounded-full bg-white"></div>
            <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-white"></div>
            <div className="absolute top-1/3 right-1/4 w-10 h-10 rounded-full bg-white"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Illustration Placeholder - You can replace with an actual 3D image */}
            <div className="mb-8 flex justify-center">
              <div className="w-40 h-40 bg-white/20 rounded-[40px] flex items-center justify-center backdrop-blur-sm">
                <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h1 className="text-white font-black text-4xl mb-4 font-nunito">
              Welcome to Peerzee!
            </h1>
            <p className="text-white/80 text-lg font-bold max-w-md mx-auto">
              Find your coding partner or your soulmate in the coziest way.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 bg-[#FDF0F1] p-8 lg:p-12 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
