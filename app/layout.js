import { ThemeProvider } from "@/components/ThemeProvider";
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
                    {children}
                    <Toaster position="top-right" richColors closeButton />
                </ThemeProvider>
            </body>
        </html>
    );
}
