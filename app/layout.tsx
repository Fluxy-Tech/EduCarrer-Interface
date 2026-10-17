import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Instrument_Serif, Manrope } from 'next/font/google'

import '../styles/globals.css'
import { Toaster } from "@/components/ui/sonner"

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
})

export const metadata: Metadata = {
  title: 'EduCarrer AI',
  description:
    'Aprenda a estudar para vagas de mercado reais com nossos agentes treinados para modelar seu conhecimento para o formato de vagas de emprego reais, e te ajudar a se preparar para elas.',
  generator: 'V1.0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans antialiased" cz-shortcut-listen="true">
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
