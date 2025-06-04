"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Trash2, Download, BarChart3, Plus } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
export const runtime = "edge";

interface Entry {
  id: string
  type: "gasto" | "ingreso"
  category: string
  amount: number
  date: string
  description?: string
}

interface CategoryTotals {
  [key: string]: number
}

const CATEGORIES = {
  gasto: ["Carne", "Agua", "Gas", "Salarios", "Insumos", "Transporte", "Servicios", "Refresco", "Otros"],
  ingreso: ["Efectivo", "Transferencia", "Ventas", "Servicios", "Otros"],
}

const STORAGE_KEY = "gestionGastosIngresos"

export default function ExpenseIncomeManager() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [newEntry, setNewEntry] = useState({
    type: "gasto" as "gasto" | "ingreso",
    category: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  })

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setEntries(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }, [])

  // Save data to localStorage whenever entries change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (error) {
      console.error("Error saving data:", error)
    }
  }, [entries])

  const addEntry = () => {
    if (!newEntry.category || !newEntry.amount) return

    const entry: Entry = {
      id: Date.now().toString(),
      type: newEntry.type,
      category: newEntry.category,
      amount: Number.parseFloat(newEntry.amount),
      date: newEntry.date,
      description: newEntry.description,
    }

    setEntries([...entries, entry])
    setNewEntry({
      type: "gasto",
      category: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
    })
  }

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id))
  }

  const exportData = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gastos-ingresos-${format(new Date(), "yyyy-MM-dd")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Calculate totals
  const totals = useMemo(() => {
    const gastos = entries.filter((e) => e.type === "gasto").reduce((sum, e) => sum + e.amount, 0)
    const ingresos = entries.filter((e) => e.type === "ingreso").reduce((sum, e) => sum + e.amount, 0)
    return { gastos, ingresos, balance: ingresos - gastos }
  }, [entries])

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const gastoTotals: CategoryTotals = {}
    const ingresoTotals: CategoryTotals = {}

    entries.forEach((entry) => {
      if (entry.type === "gasto") {
        gastoTotals[entry.category] = (gastoTotals[entry.category] || 0) + entry.amount
      } else {
        ingresoTotals[entry.category] = (ingresoTotals[entry.category] || 0) + entry.amount
      }
    })

    return { gastos: gastoTotals, ingresos: ingresoTotals }
  }, [entries])

  // Calculate daily totals for calendar view
  const dailyTotals = useMemo(() => {
    const totalsByDate: { [date: string]: { ingresos: number; gastos: number } } = {}

    entries.forEach((entry) => {
      const dateStr = entry.date
      if (!totalsByDate[dateStr]) {
        totalsByDate[dateStr] = { ingresos: 0, gastos: 0 }
      }
      if (entry.type === "ingreso") {
        totalsByDate[dateStr].ingresos += entry.amount
      } else {
        totalsByDate[dateStr].gastos += entry.amount
      }
    })

    return totalsByDate
  }, [entries])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-800">Gestión de Gastos e Ingresos</h1>
          <p className="text-gray-600">Controla tus finanzas de manera eficiente</p>
          <div className="flex justify-center gap-4">
            <Link href="/calendar" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ver Calendario
            </Link>
            <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Datos
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">${totals.ingresos.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Gastos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">${totals.gastos.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className={`${totals.balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${totals.balance >= 0 ? "text-blue-800" : "text-orange-800"}`}>
                Balance
              </CardTitle>
              <DollarSign className={`h-4 w-4 ${totals.balance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                ${totals.balance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nueva Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newEntry.type}
                  onValueChange={(value: "gasto" | "ingreso") =>
                    setNewEntry({ ...newEntry, type: value, category: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasto">Gasto</SelectItem>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={newEntry.category}
                  onValueChange={(value) => setNewEntry({ ...newEntry, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[newEntry.type].map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Opcional"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={addEntry} className="w-full md:w-auto">
              Agregar Entrada
            </Button>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="entries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entries">Entradas Recientes</TabsTrigger>
            <TabsTrigger value="categories">Por Categorías</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Entradas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {entries.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay entradas registradas</p>
                  ) : (
                    entries
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={entry.type === "ingreso" ? "default" : "destructive"}>
                              {entry.type === "ingreso" ? "Ingreso" : "Gasto"}
                            </Badge>
                            <div>
                              <p className="font-medium">{entry.category}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(entry.date), "dd/MM/yyyy", { locale: es })}
                                {entry.description && ` • ${entry.description}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${entry.type === "ingreso" ? "text-green-600" : "text-red-600"}`}
                            >
                              ${entry.amount.toLocaleString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEntry(entry.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">Gastos por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(categoryTotals.gastos).map(([category, amount]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm font-bold text-red-600">${amount.toLocaleString()}</span>
                      </div>
                      <Progress value={totals.gastos > 0 ? (amount / totals.gastos) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Ingresos por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(categoryTotals.ingresos).map(([category, amount]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm font-bold text-green-600">${amount.toLocaleString()}</span>
                      </div>
                      <Progress value={totals.ingresos > 0 ? (amount / totals.ingresos) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Análisis Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Resumen del Período</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Total de entradas: <span className="font-medium">{entries.length}</span>
                      </p>
                      <p>
                        Promedio de gastos:{" "}
                        <span className="font-medium">
                          $
                          {entries.filter((e) => e.type === "gasto").length > 0
                            ? (totals.gastos / entries.filter((e) => e.type === "gasto").length).toLocaleString()
                            : 0}
                        </span>
                      </p>
                      <p>
                        Promedio de ingresos:{" "}
                        <span className="font-medium">
                          $
                          {entries.filter((e) => e.type === "ingreso").length > 0
                            ? (totals.ingresos / entries.filter((e) => e.type === "ingreso").length).toLocaleString()
                            : 0}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Estado Financiero</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Ratio Ingreso/Gasto:{" "}
                        <span className="font-medium">
                          {totals.gastos > 0 ? (totals.ingresos / totals.gastos).toFixed(2) : "∞"}
                        </span>
                      </p>
                      <p>
                        Tasa de ahorro:{" "}
                        <span className="font-medium">
                          {totals.ingresos > 0 ? ((totals.balance / totals.ingresos) * 100).toFixed(1) : 0}%
                        </span>
                      </p>
                      <p className={`font-medium ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {totals.balance >= 0 ? "✓ Superávit" : "⚠ Déficit"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
