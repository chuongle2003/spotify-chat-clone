"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UserStats as UserStatsType } from "@/lib/api/services/AdminUserService"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { User, UserPlus, UserCheck, Shield, AlertTriangle } from "lucide-react"

interface UserStatsProps {
    stats: UserStatsType
}

export default function UserStats({ stats }: UserStatsProps) {
    const statItems = [
        {
            title: "Tổng người dùng",
            value: stats.total_users,
            description: "Tổng số người dùng đã đăng ký",
            icon: <User className="h-4 w-4" />,
            color: "text-blue-400"
        },
        {
            title: "Đang hoạt động",
            value: stats.active_users,
            description: "Người dùng có trạng thái hoạt động",
            icon: <UserCheck className="h-4 w-4" />,
            color: "text-emerald-400"
        },
        {
            title: "Không hoạt động",
            value: stats.inactive_users,
            description: "Người dùng bị vô hiệu hóa",
            icon: <User className="h-4 w-4" />,
            color: "text-zinc-400"
        },
        {
            title: "Admin",
            value: stats.admin_users,
            description: "Người dùng có quyền admin",
            icon: <Shield className="h-4 w-4" />,
            color: "text-purple-400"
        },
        {
            title: "Bị hạn chế",
            value: stats.restricted_users,
            description: "Người dùng bị hạn chế chat",
            icon: <AlertTriangle className="h-4 w-4" />,
            color: "text-amber-400"
        },
        {
            title: "Mới (7 ngày)",
            value: stats.new_users_last_7_days,
            description: "Người dùng mới trong 7 ngày qua",
            icon: <UserPlus className="h-4 w-4" />,
            color: "text-teal-400"
        }
    ]

    return (
        <Card className="bg-zinc-800 border-zinc-700 text-white">
            <CardHeader>
                <CardTitle>Thống kê người dùng</CardTitle>
                <CardDescription className="text-zinc-400">
                    Tổng quan về người dùng trong hệ thống
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    {statItems.map((item, index) => (
                        <Card key={index} className="bg-zinc-900 border-zinc-700">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <span className={`flex items-center justify-center p-2 rounded-lg bg-opacity-20 ${item.color.replace('text', 'bg')}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <h3 className="text-sm font-medium">{item.title}</h3>
                                <p className="text-xs text-zinc-400">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-6">
                    <h3 className="font-medium mb-4">Người dùng mới (7 ngày qua)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.users_by_day} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'rgb(161 161 170)' }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                />
                                <YAxis tick={{ fill: 'rgb(161 161 170)' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#27272a',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white'
                                    }}
                                    formatter={(value) => [`${value} người dùng`, 'Số lượng']}
                                    labelFormatter={(label) => `Ngày ${new Date(label).toLocaleDateString('vi-VN')}`}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#06b6d4"
                                    radius={[4, 4, 0, 0]}
                                    name="Số người dùng"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 