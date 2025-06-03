"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, AlertCircle, CheckCircle, X, ExternalLink } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { postmanApi } from "@/lib/api/postman"

// Kiểu dữ liệu cho báo cáo
interface MessageReport {
    id: number
    message: {
        id: number
        content: string
        sender_info: {
            id: number
            username: string
        }
    }
    reporter: {
        id: number
        username: string
    }
    reason: string
    description: string
    timestamp: string
    status: string
    handled_by: {
        id: number
        username: string
    } | null
    handled_at: string | null
    action_taken: string
}

// Kiểu dữ liệu cho thống kê báo cáo
interface ReportStatistics {
    total_reports: number
    pending_reports: number
    resolved_reports: number
    dismissed_reports: number
    by_reason: {
        INAPPROPRIATE: number
        SPAM: number
        HARASSMENT: number
        HATE_SPEECH: number
        OTHER: number
    }
    recent_trend: Array<{ date: string; count: number }>
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<MessageReport[]>([])
    const [statistics, setStatistics] = useState<ReportStatistics | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [reasonFilter, setReasonFilter] = useState<string>("all")
    const [selectedReport, setSelectedReport] = useState<MessageReport | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [actionTaken, setActionTaken] = useState("")
    const [newStatus, setNewStatus] = useState("RESOLVED")

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [reportsData, statsData] = await Promise.all([
                    postmanApi.chat.getReports(),
                    postmanApi.chat.getReportStatistics()
                ])

                setReports(reportsData as MessageReport[])
                setStatistics(statsData as ReportStatistics)
            } catch (error) {
                console.error("Error fetching reports:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Chuyển đổi timestamp sang định dạng thân thiện với người dùng
    const formatDate = (timestamp: string) => {
        if (!timestamp) return "N/A"
        const date = new Date(timestamp)
        return date.toLocaleString("vi-VN")
    }

    // Lọc báo cáo
    const filteredReports = reports.filter((report) => {
        // Lọc theo trạng thái
        if (statusFilter !== "all" && report.status !== statusFilter) {
            return false
        }

        // Lọc theo lý do
        if (reasonFilter !== "all" && report.reason !== reasonFilter) {
            return false
        }

        // Tìm kiếm theo nội dung hoặc người dùng
        const searchLower = searchQuery.toLowerCase()
        return (
            report.message.content.toLowerCase().includes(searchLower) ||
            report.message.sender_info.username.toLowerCase().includes(searchLower) ||
            report.reporter.username.toLowerCase().includes(searchLower) ||
            (report.description && report.description.toLowerCase().includes(searchLower))
        )
    })

    // Xử lý cập nhật trạng thái báo cáo
    const handleUpdateReport = async () => {
        if (!selectedReport) return

        try {
            await postmanApi.chat.updateReportStatus(selectedReport.id.toString(), {
                status: newStatus,
                action_taken: actionTaken
            })

            // Cập nhật danh sách báo cáo
            setReports(reports.map((report) => {
                if (report.id === selectedReport.id) {
                    return {
                        ...report,
                        status: newStatus,
                        action_taken: actionTaken,
                        handled_at: new Date().toISOString(),
                        handled_by: { id: 1, username: "admin" } // Giả định người dùng hiện tại
                    }
                }
                return report
            }))

            // Đóng dialog
            setIsDetailsOpen(false)
            setSelectedReport(null)
            setActionTaken("")
        } catch (error) {
            console.error("Error updating report:", error)
            alert("Có lỗi xảy ra khi cập nhật báo cáo")
        }
    }

    // Lấy badge class theo trạng thái
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-600 hover:bg-yellow-700"
            case "RESOLVED":
                return "bg-green-600 hover:bg-green-700"
            case "DISMISSED":
                return "bg-zinc-600 hover:bg-zinc-700"
            default:
                return "bg-zinc-600 hover:bg-zinc-700"
        }
    }

    // Lấy tên hiển thị của lý do báo cáo
    const getReasonDisplay = (reason: string) => {
        switch (reason) {
            case "INAPPROPRIATE":
                return "Nội dung không phù hợp"
            case "SPAM":
                return "Spam"
            case "HARASSMENT":
                return "Quấy rối"
            case "HATE_SPEECH":
                return "Phát ngôn thù địch"
            case "OTHER":
                return "Khác"
            default:
                return reason
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Quản lý báo cáo tin nhắn</h1>
            </div>

            <Tabs defaultValue="reports">
                <TabsList className="bg-zinc-800">
                    <TabsTrigger value="reports">Danh sách báo cáo</TabsTrigger>
                    <TabsTrigger value="statistics">Thống kê</TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="mt-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Tìm kiếm báo cáo..."
                                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value)}
                        >
                            <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="PENDING">Đang chờ xử lý</SelectItem>
                                <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
                                <SelectItem value="DISMISSED">Đã bỏ qua</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={reasonFilter}
                            onValueChange={(value) => setReasonFilter(value)}
                        >
                            <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue placeholder="Lý do" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="all">Tất cả lý do</SelectItem>
                                <SelectItem value="INAPPROPRIATE">Không phù hợp</SelectItem>
                                <SelectItem value="SPAM">Spam</SelectItem>
                                <SelectItem value="HARASSMENT">Quấy rối</SelectItem>
                                <SelectItem value="HATE_SPEECH">Phát ngôn thù địch</SelectItem>
                                <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-zinc-700/50">
                                    <TableHead className="text-zinc-400">ID</TableHead>
                                    <TableHead className="text-zinc-400">Nội dung báo cáo</TableHead>
                                    <TableHead className="text-zinc-400">Người báo cáo</TableHead>
                                    <TableHead className="text-zinc-400">Lý do</TableHead>
                                    <TableHead className="text-zinc-400">Thời gian</TableHead>
                                    <TableHead className="text-zinc-400">Trạng thái</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                                            Đang tải dữ liệu...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredReports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                                            Không tìm thấy báo cáo nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReports.map((report) => (
                                        <TableRow key={report.id} className="hover:bg-zinc-700/50">
                                            <TableCell>{report.id}</TableCell>
                                            <TableCell>
                                                <div className="max-w-md truncate">
                                                    {report.message.content}
                                                </div>
                                            </TableCell>
                                            <TableCell>{report.reporter.username}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{getReasonDisplay(report.reason)}</Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(report.timestamp)}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadgeClass(report.status)}>
                                                    {report.status === "PENDING" && "Đang chờ xử lý"}
                                                    {report.status === "RESOLVED" && "Đã xử lý"}
                                                    {report.status === "DISMISSED" && "Đã bỏ qua"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedReport(report)
                                                        setNewStatus(report.status)
                                                        setActionTaken(report.action_taken || "")
                                                        setIsDetailsOpen(true)
                                                    }}
                                                >
                                                    Chi tiết
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="statistics" className="mt-6">
                    {statistics ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-zinc-800 border-zinc-700 text-white">
                                <CardHeader>
                                    <CardTitle>Tổng quan báo cáo</CardTitle>
                                    <CardDescription className="text-zinc-400">Số liệu tổng hợp về báo cáo</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span>Tổng số báo cáo:</span>
                                            <span className="font-bold">{statistics.total_reports}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Đang chờ xử lý:</span>
                                            <span className="font-bold text-yellow-500">{statistics.pending_reports}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Đã xử lý:</span>
                                            <span className="font-bold text-green-500">{statistics.resolved_reports}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Đã bỏ qua:</span>
                                            <span className="font-bold text-zinc-400">{statistics.dismissed_reports}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-800 border-zinc-700 text-white">
                                <CardHeader>
                                    <CardTitle>Phân loại theo lý do</CardTitle>
                                    <CardDescription className="text-zinc-400">Số lượng báo cáo theo từng lý do</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span>Nội dung không phù hợp:</span>
                                            <span className="font-bold">{statistics.by_reason.INAPPROPRIATE}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Spam:</span>
                                            <span className="font-bold">{statistics.by_reason.SPAM}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Quấy rối:</span>
                                            <span className="font-bold">{statistics.by_reason.HARASSMENT}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Phát ngôn thù địch:</span>
                                            <span className="font-bold">{statistics.by_reason.HATE_SPEECH}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Khác:</span>
                                            <span className="font-bold">{statistics.by_reason.OTHER}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-800 border-zinc-700 text-white md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Xu hướng gần đây</CardTitle>
                                    <CardDescription className="text-zinc-400">Số lượng báo cáo theo ngày</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {statistics.recent_trend.map((item) => (
                                            <div key={item.date} className="flex justify-between">
                                                <span>{item.date}:</span>
                                                <span className="font-bold">{item.count} báo cáo</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center p-10">
                            <p className="text-zinc-500">Đang tải dữ liệu thống kê...</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialog Chi tiết báo cáo */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết báo cáo #{selectedReport?.id}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Xem và cập nhật trạng thái báo cáo
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Người gửi tin nhắn</h4>
                                    <p className="text-zinc-300">{selectedReport.message.sender_info.username}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Người báo cáo</h4>
                                    <p className="text-zinc-300">{selectedReport.reporter.username}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Thời gian báo cáo</h4>
                                    <p className="text-zinc-300">{formatDate(selectedReport.timestamp)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Trạng thái</h4>
                                    <Badge className={getStatusBadgeClass(selectedReport.status)}>
                                        {selectedReport.status === "PENDING" && "Đang chờ xử lý"}
                                        {selectedReport.status === "RESOLVED" && "Đã xử lý"}
                                        {selectedReport.status === "DISMISSED" && "Đã bỏ qua"}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-1">Lý do báo cáo</h4>
                                <p className="text-zinc-300">{getReasonDisplay(selectedReport.reason)}</p>
                                {selectedReport.description && (
                                    <p className="text-zinc-400 mt-1 text-sm">{selectedReport.description}</p>
                                )}
                            </div>

                            <div className="bg-zinc-800 p-4 rounded-md">
                                <h4 className="text-sm font-medium mb-2">Nội dung tin nhắn báo cáo</h4>
                                <p className="text-zinc-300">{selectedReport.message.content}</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Cập nhật trạng thái</h4>
                                <Select
                                    value={newStatus}
                                    onValueChange={setNewStatus}
                                >
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                        <SelectItem value="PENDING">Đang chờ xử lý</SelectItem>
                                        <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
                                        <SelectItem value="DISMISSED">Đã bỏ qua</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Hành động đã thực hiện</label>
                                    <Textarea
                                        placeholder="Nhập hành động đã thực hiện để xử lý báo cáo này..."
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                        value={actionTaken}
                                        onChange={(e) => setActionTaken(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDetailsOpen(false)}
                        >
                            <X className="h-4 w-4 mr-2" /> Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateReport}
                            disabled={!selectedReport}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" /> Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 