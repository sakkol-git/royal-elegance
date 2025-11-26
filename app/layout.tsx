import type React from "react"
import type { Metadata } from "next"
import { Inter, Orbitron } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { EnvBanner } from "@/components/system/env-banner"
import "./globals.css"
import { PremiumFooter } from "@/components/layout/premium-footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-display" })

export const metadata: Metadata = {
  title: "Luxury Hotel - Premium Accommodations",
  description: "Experience unparalleled luxury and comfort",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <EnvBanner />
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
