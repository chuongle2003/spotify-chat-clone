"use client"

import { useState } from "react"
import {
    AUTH_ERROR_CODES,
    USER_ERROR_CODES,
    API_ERROR_CODES,
    type ErrorCode
} from "@/lib/error-codes"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ErrorCodesPage() {
    const [searchTerm, setSearchTerm] = useState("")

    // Get all error codes
    const allErrorCategories = [
        { name: "Auth", codes: AUTH_ERROR_CODES },
        { name: "User", codes: USER_ERROR_CODES },
        { name: "API", codes: API_ERROR_CODES }
    ]

    // Function to render badge based on error type
    const renderBadge = (type: string) => {
        switch (type) {
            case 'success':
                return <Badge className="bg-green-500">{type}</Badge>
            case 'error':
                return <Badge className="bg-red-500">{type}</Badge>
            case 'warning':
                return <Badge className="bg-yellow-500">{type}</Badge>
            case 'info':
                return <Badge className="bg-blue-500">{type}</Badge>
            default:
                return <Badge>{type}</Badge>
        }
    }

    // Function to filter error codes based on search term
    const filterErrorCodes = (codes: Record<string, ErrorCode>) => {
        if (!searchTerm) return Object.entries(codes)

        return Object.entries(codes).filter(([key, value]) =>
            key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            value.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            value.code.toString().includes(searchTerm)
        )
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Quản lý mã lỗi API</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
                Trang quản lý các mã lỗi và thông báo mà API trả về, giúp dễ dàng kiểm soát và chuẩn hóa lỗi trong toàn bộ ứng dụng.
            </p>

            <div className="mb-6">
                <Input
                    placeholder="Tìm kiếm mã lỗi, thông báo hoặc mã số..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    {allErrorCategories.map(category => (
                        <TabsTrigger key={category.name} value={category.name.toLowerCase()}>
                            {category.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="all">
                    <div className="grid gap-6">
                        {allErrorCategories.map(category => (
                            <Card key={category.name}>
                                <CardHeader>
                                    <CardTitle>{category.name} Error Codes</CardTitle>
                                    <CardDescription>
                                        Các mã lỗi liên quan đến {category.name === "Auth" ? "xác thực" :
                                            category.name === "User" ? "người dùng" : "API chung"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px]">
                                        <ErrorCodeTable
                                            errorCodes={filterErrorCodes(category.codes)}
                                            renderBadge={renderBadge}
                                        />
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {allErrorCategories.map(category => (
                    <TabsContent key={category.name} value={category.name.toLowerCase()}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{category.name} Error Codes</CardTitle>
                                <CardDescription>
                                    Các mã lỗi liên quan đến {category.name === "Auth" ? "xác thực" :
                                        category.name === "User" ? "người dùng" : "API chung"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[600px]">
                                    <ErrorCodeTable
                                        errorCodes={filterErrorCodes(category.codes)}
                                        renderBadge={renderBadge}
                                    />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

interface ErrorCodeTableProps {
    errorCodes: [string, ErrorCode][]
    renderBadge: (type: string) => React.ReactNode
}

function ErrorCodeTable({ errorCodes, renderBadge }: ErrorCodeTableProps) {
    // Handle case when no error codes are found
    if (errorCodes.length === 0) {
        return <div className="text-center py-4">Không tìm thấy mã lỗi phù hợp</div>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[200px]">Mã khóa</TableHead>
                    <TableHead className="w-[100px]">Mã số</TableHead>
                    <TableHead>Thông báo</TableHead>
                    <TableHead className="w-[100px]">Loại</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {errorCodes.map(([key, error]) => (
                    <TableRow key={key}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell>{error.code}</TableCell>
                        <TableCell>{error.message}</TableCell>
                        <TableCell>{renderBadge(error.type)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
} 