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
import { Music, Download, ArrowUpDown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { api } from "@/lib/api"

export default function TopSongsReportPage() {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState("month")
    const [limit, setLimit] = useState("20")
    const [sorting, setSorting] = useState<{ field: string; direction: 'asc' | 'desc' }>({
        field: 'total_plays',
        direction: 'desc'
    })

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true)
                const response = await api.admin.getTopSongsReport(period, parseInt(limit))
                setReport(response)
            } catch (error) {
                console.error("Error fetching top songs report:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchReport()
    }, [period, limit])

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

    // Chuyển đổi dữ liệu cho biểu đồ - giới hạn 10 bài đầu tiên
    const chartData = sortedResults.slice(0, 10).map((song: any) => ({
        name: song.title.length > 15 ? song.title.substring(0, 15) + '...' : song.title,
        plays: song.total_plays,
        recent: song.recent_plays,
    }))

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
                <h1 className="text-3xl font-bold">Báo cáo top bài hát</h1>

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
                        <label htmlFor="limit" className="text-sm whitespace-nowrap">Số lượng:</label>
                        <Select
                            value={limit}
                            onValueChange={setLimit}
                        >
                            <SelectTrigger id="limit" className="w-[90px] bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder="Số lượng" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
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
                                <Music className="h-5 w-5" />
                                <span>Top 10 bài hát được nghe nhiều nhất</span>
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Biểu đồ thống kê lượt nghe
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
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
                                        <Bar dataKey="plays" name="Tổng lượt nghe" fill="#1DB954" />
                                        <Bar dataKey="recent" name="Lượt nghe gần đây" fill="#3E5BDB" />
                                    </BarChart>
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
                            <CardTitle>Chi tiết các bài hát</CardTitle>
                            <CardDescription className="text-zinc-400">
                                {report?.results?.length || 0} bài hát hàng đầu
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {report?.results && report.results.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-zinc-700/50">
                                            <TableHead className="w-12">STT</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                                                <div className="flex items-center gap-1">
                                                    Bài hát
                                                    {sorting.field === 'title' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('artist')}>
                                                <div className="flex items-center gap-1">
                                                    Nghệ sĩ
                                                    {sorting.field === 'artist' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('album')}>
                                                <div className="flex items-center gap-1">
                                                    Album
                                                    {sorting.field === 'album' && (
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
                                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort('recent_plays')}>
                                                <div className="flex items-center gap-1 justify-end">
                                                    Lượt nghe gần đây
                                                    {sorting.field === 'recent_plays' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort('likes')}>
                                                <div className="flex items-center gap-1 justify-end">
                                                    Lượt thích
                                                    {sorting.field === 'likes' && (
                                                        <ArrowUpDown className={`h-3 w-3 ${sorting.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedResults.map((song: any, index: number) => (
                                            <TableRow key={song.id} className="hover:bg-zinc-700/50">
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center">
                                                            <Music className="w-4 h-4 text-zinc-400" />
                                                        </div>
                                                        <div>{song.title}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{song.artist}</TableCell>
                                                <TableCell>{song.album}</TableCell>
                                                <TableCell className="text-right">{song.total_plays.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{song.recent_plays.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{song.likes.toLocaleString()}</TableCell>
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