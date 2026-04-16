import { AuthProvider } from '@/components/AuthContext';
import Navbar from '@/components/layout/Navbar';

// Browse section layout with auth context and persistent navigation
export default function BrowseLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <Navbar />
            <main className="pt-0">{children}</main>
            <footer className="mt-16 border-t border-[#1e4a5c]/50 py-8 px-8">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-display text-xl text-[#00A0EC] tracking-widest mb-1">STREAMIX</p>
                        <p className="text-[#7a9caa] text-xs">
                            Movie data provided by{' '}
                            <a href="https://www.themoviedb.org" className="text-[#7a9caa] hover:text-white transition-colors underline"
                               target="_blank" rel="noopener noreferrer">TMDb</a>. For educational purposes only.
                        </p>
                    </div>
                    <p className="text-[#7a9caa] text-xs">© {new Date().getFullYear()} Streamix</p>
                </div>
            </footer>
        </AuthProvider>
    );
}