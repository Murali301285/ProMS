import { ThemeProvider } from "@/components/ThemeProvider";
import { UIProvider } from "@/contexts/UIContext";
import "./globals.css";

export const metadata = {
    title: "ProMS - Production Management System",
    description: "Advanced Production Management for Mining",
};

import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <ThemeProvider>
                    <UIProvider>
                        {children}
                        <Toaster position="top-right" richColors closeButton />
                    </UIProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
