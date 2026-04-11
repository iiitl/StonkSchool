import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
                        <div className="relative bg-gray-900 border border-white/5 w-32 h-32 rounded-3xl flex flex-col items-center justify-center shadow-2xl">
                            <span className="text-5xl font-black text-emerald-500 mb-1">404</span>
                            <div className="h-1 w-12 bg-gray-800 rounded-full" />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">Lost in the Charts?</h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    The page you're looking for doesn't exist. It might have been delisted or moved to a different exchange.
                </p>
            </div>
        </div>
    );
}
