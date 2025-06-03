"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Music, Download, ArrowUpDown, BarChart3 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { api } from "@/lib/api"

export default function TopGenresReportPage() {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState("month")
    const [chartType, setChartType] = useState<"pie" | "bar">("pie")
    const [sorting, setSorting] = useState<{ field: string; direction: 'asc' | 'desc' }>({
        field: 'total_plays',
        direction: 'desc'
    })

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true)
                const response = await api.admin.getTopGenresReport(period)
                setReport(response)
            } catch (error) {
                console.error("Error fetching top genres report:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchReport()
    }, [period])

    const handleSort = (field: string) => {
        if (sorting.field === field) {
            // Toggle direction if same field
            setSorting({
                field,
                direction: sorting.direction === 'asc' ? 'desc' : 'asc'
            })
        } else {
            // New field, default to descending
            setSorting({
                field,
                direction: 'desc'
            })
        }
    }

    const sortedResults = report?.results ? [...report.results].sort((a, b) => {
        if (sorting.direction === 'asc') {
            return a[sorting.field] > b[sorting.field] ? 1 : -1
        } else {
            return a[sorting.field] < b[sorting.field] ? 1 : -1
        }
    }) : []

    // Chuẩn bị dữ liệu cho biểu đồ
    const chartData = sortedResults.map((genre: any) => ({
        name: genre.name,
        value: genre.total_plays,
        songs: genre.song_count,
        avgPlays: genre.avg_plays
    }))

    // Màu sắc cho biểu đồ tròn
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A44CC9', '#4CAF50', '#FF5252', '#607D8B', '#795548', '#9C27B0'];

    // Hàm tạo file Excel
    const exportToExcel = () => {
        if (!report || !report.results || report.results.length === 0) return

        // Trong thực tế, bạn sẽ muốn sử dụng thư viện như xlsx hoặc file-saver
        console.log("Exporting to Excel:", report)
        alert("Chức năng xuất Excel sẽ được triển khai trong thực tế")
    }

    // Hàm tạo file PDF
    const exportToPDF = () => {
        if (!report || !report.results || report.results.length === 0) return

        // Trong thực tế, bạn sẽ muốn sử dụng thư viện như jspdf hoặc react-pdf
        console.log("Exporting to PDF:", report)
        alert("Chức năng xuất PDF sẽ được triển khai trong thực tế")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold">Báo cáo top thể loại</h1>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="period" className="text-sm whitespace-nowrap">Khoảng thời gian:</label>
                        <Select
                            value={period}
                            onValueChange={setPeriod}
                        >
                            <SelectTrigger id="period" className="w-[140px] bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder="Chọn thời gian" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="week">Tuần này</SelectItem>
                                <SelectItem value="month">Tháng này</SelectItem>
                                <SelectItem value="year">Năm nay</SelectItem>
                                <SelectItem value="all">Tất cả</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="chart-type" className="text-sm whitespace-nowrap">Loại biểu đồ:</label>
                        <Select
                            value={chartType}
                            onValueChange={(value: "pie" | "bar") => setChartType(value)}
                        >
                            <SelectTrigger id="chart-type" className="w-[120px] bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder="Loại biểu đồ" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="pie">Biểu đồ tròn</SelectItem>
                                <SelectItem value="bar">Biểu đồ cột</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Thời gian báo cáo */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-zinc-400">
                    {report && (
                        <>
                            <span>Báo cáo thời gian: <span className="font-medium text-white">{report.period}</span></span>
                            <span className="mx-3">|</span>
                            <span>Tạo lúc: <span className="font-medium text-white">{report.generated_at}</span></span>
                        </>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={exportToExcel}
                        disabled={loading || !report || !report.results || report.results.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        <span>Excel</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={exportToPDF}
                        disabled={loading || !report || !report.results || report.results.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        <span>PDF</span>
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin h-8 w-8 border-t-2 border-green-500 rounded-full"></div>
                </div>
            ) : (
                <>
                    {/* Biểu đồ */}
                    <Card className="bg-zinc-800 border-zinc-700 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>Phân bố lượt nghe theo thể loại</span>
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Thống kê lượt nghe theo thể loại nhạc
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-96">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === "pie" ? (
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={150}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#333', border: 'none' }}
                                                formatter={(value, name, props) => [`${value.toLocaleString()} lượt nghe`, props.payload.name]}
                                            />
                                            <Legend />
                                        </PieChart>
                                    ) : (
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#888"
                                                angle={-45}
                                                textAnchor="end"
                                                height={70}
                                            />
                                            <YAxis stroke="#888" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#333', border: 'none' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="value" name="Tổng lượt nghe" fill="#1DB954" />
                                            <Bar dataKey="songs" name="Số bài hát" fill="#3E5BDB" />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-500">
                                    Không có dữ liệu để hiển thị
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bảng dữ liệu */}
                    <Card className="bg-zinc-800 border-zinc-700 text-white">
                        <CardHeader>
                            <CardTitle>Chi tiết các thể loại</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Danh sách thể loại nhạc và lượt nghe
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sortedResults.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-zinc-700/50">
                                            <TableHead className="w-12">STT</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                                                <div className="flex items-center gap-1">
                                                    Thể loại
                                                    {sorting.field === 'name' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort('song_count')}>
                                                <div className="flex items-center gap-1 justify-end">
                                                    Số bài hát
                                                    {sorting.field === 'song_count' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort('total_plays')}>
                                                <div className="flex items-center gap-1 justify-end">
                                                    Tổng lượt nghe
                                                    {sorting.field === 'total_plays' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort('avg_plays')}>
                                                <div className="flex items-center gap-1 justify-end">
                                                    Trung bình lượt nghe/bài
                                                    {sorting.field === 'avg_plays' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort('trend')}>
                                                <div className="flex items-center gap-1 justify-end">
                                                    Xu hướng
                                                    {sorting.field === 'trend' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedResults.map((genre: any, index: number) => (
                                            <TableRow key={index} className="hover:bg-zinc-700/50">
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        ></div>
                                                        <div>{genre.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{genre.song_count.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{genre.total_plays.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{genre.avg_plays.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`text-sm ${genre.trend > 0 ? 'text-green-500' : genre.trend < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                                                        {genre.trend > 0 ? '+' : ''}{genre.trend}%
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8 text-zinc-500">
                                    Không có dữ liệu để hiển thị
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
} 