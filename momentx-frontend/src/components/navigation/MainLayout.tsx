import type { ReactNode } from "react"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"
import { Sidebar } from "./Sidebar"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 pb-20 md:pb-0 lg:pl-64">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
