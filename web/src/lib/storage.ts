import { AppData } from './types'
import { seedData } from './seed'

const KEY = 'kimar_data'

export function loadData(): AppData {
  if (typeof window === 'undefined') return seedData
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seedData))
    return seedData
  }
  try {
    const parsed = JSON.parse(raw)
    // Migration: ensure new fields exist
    if (!parsed.compromisosProveedor) parsed.compromisosProveedor = []
    if (!parsed.instanciasGasto) parsed.instanciasGasto = []
    if (!parsed.productosProveedores) parsed.productosProveedores = []
    if (!parsed.movimientosStock) parsed.movimientosStock = []
    if (!parsed.stockPorProducto) parsed.stockPorProducto = []
    if (!parsed.stockRealRegistrado) parsed.stockRealRegistrado = []
    // Remove legacy fields
    delete parsed.deudasProveedor
    return parsed as AppData
  } catch {
    return seedData
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function resetData(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(seedData))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
