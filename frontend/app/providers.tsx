import { AuthProvider } from "@/context/auth-context"
import { ThemeProvider } from "@/context/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PlayerProvider } from "@/components/player/PlayerProvider"
import { FavoriteProvider } from "@/context/favorite-context"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <FavoriteProvider>
                    <PlayerProvider>
                        {children}
                        <Toaster />
                    </PlayerProvider>
                </FavoriteProvider>
            </AuthProvider>
        </ThemeProvider>
    )
} 