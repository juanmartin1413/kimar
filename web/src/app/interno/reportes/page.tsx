'use client'
import { Construction } from 'lucide-react'
export default function ReportesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24 space-y-4">
      <div className="w-16 h-16 bg-[oklch(0.92_0.04_240)] rounded-2xl flex items-center justify-center">
        <Construction className="w-8 h-8 text-[oklch(0.42_0.14_240)]" />
      </div>
      <h1 className="text-2xl font-bold text-[oklch(0.2_0.06_240)]">Reportes</h1>
      <p className="text-[oklch(0.5_0.04_240)] max-w-xs">Reportes e informes de gestión — próximamente en Sprint 4</p>
    </div>
  )
}
