"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Spotify Clone",
    siteDescription: "Nền tảng nghe nhạc trực tuyến",
    language: "vi",
    maintenanceMode: false,
    maintenanceMessage: "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
  })
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSymbol: false,
    twoFactorAuth: false,
    sessionTimeout: 30,
  })
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    senderEmail: "no-reply@spotify-clone.com",
    senderName: "Spotify Clone",
    enableEmailNotifications: true,
    notifyOnNewUser: true,
    notifyOnNewPlaylist: false,
  })

  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try {
      // In a real app, you would call an API to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Cài đặt chung đã được lưu")
    } catch (error) {
      console.error("Error saving general settings:", error)
      alert("Có lỗi xảy ra khi lưu cài đặt")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    setIsSaving(true)
    try {
      // In a real app, you would call an API to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Cài đặt bảo mật đã được lưu")
    } catch (error) {
      console.error("Error saving security settings:", error)
      alert("Có lỗi xảy ra khi lưu cài đặt")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEmail = async () => {
    setIsSaving(true)
    try {
      // In a real app, you would call an API to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Cài đặt email đã được lưu")
    } catch (error) {
      console.error("Error saving email settings:", error)
      alert("Có lỗi xảy ra khi lưu cài đặt")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-zinc-800 border-zinc-700 text-white">
            <CardHeader>
              <CardTitle>Cài đặt chung</CardTitle>
              <CardDescription className="text-zinc-400">Quản lý các cài đặt chung của hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Tên trang web</Label>
                <Input
                  id="site-name"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Mô tả trang web</Label>
                <Textarea
                  id="site-description"
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ mặc định</Label>
                <Select
                  value={generalSettings.language}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                >
                  <SelectTrigger id="language" className="bg-zinc-700 border-zinc-600 text-white">
                    <SelectValue placeholder="Chọn ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-700 border-zinc-600 text-white">
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4 bg-zinc-700" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Chế độ bảo trì</Label>
                    <p className="text-sm text-zinc-400">Kích hoạt chế độ bảo trì cho trang web</p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({ ...generalSettings, maintenanceMode: checked })
                    }
                  />
                </div>

                {generalSettings.maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Thông báo bảo trì</Label>
                    <Textarea
                      id="maintenance-message"
                      value={generalSettings.maintenanceMessage}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMessage: e.target.value })}
                      className="bg-zinc-700 border-zinc-600 text-white"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="bg-zinc-800 border-zinc-700 text-white">
            <CardHeader>
              <CardTitle>Cài đặt bảo mật</CardTitle>
              <CardDescription className="text-zinc-400">Quản lý các cài đặt bảo mật của hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Chính sách mật khẩu</h3>

                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Độ dài tối thiểu</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    min={6}
                    max={32}
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: Number.parseInt(e.target.value) || 8,
                      })
                    }
                    className="bg-zinc-700 border-zinc-600 text-white w-24"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="password-require-uppercase"
                    checked={securitySettings.passwordRequireUppercase}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, passwordRequireUppercase: checked })
                    }
                  />
                  <Label htmlFor="password-require-uppercase">Yêu cầu chữ hoa</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="password-require-number"
                    checked={securitySettings.passwordRequireNumber}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, passwordRequireNumber: checked })
                    }
                  />
                  <Label htmlFor="password-require-number">Yêu cầu số</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="password-require-symbol"
                    checked={securitySettings.passwordRequireSymbol}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, passwordRequireSymbol: checked })
                    }
                  />
                  <Label htmlFor="password-require-symbol">Yêu cầu ký tự đặc biệt</Label>
                </div>
              </div>

              <Separator className="my-4 bg-zinc-700" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Xác thực hai yếu tố</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor-auth">Xác thực hai yếu tố</Label>
                    <p className="text-sm text-zinc-400">Yêu cầu xác thực hai yếu tố cho tất cả người dùng</p>
                  </div>
                  <Switch
                    id="two-factor-auth"
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                    }
                  />
                </div>
              </div>

              <Separator className="my-4 bg-zinc-700" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Phiên đăng nhập</h3>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Thời gian hết hạn phiên (phút)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min={5}
                    max={1440}
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: Number.parseInt(e.target.value) || 30,
                      })
                    }
                    className="bg-zinc-700 border-zinc-600 text-white w-24"
                  />
                  <p className="text-xs text-zinc-400">Đặt 0 để không bao giờ hết hạn</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSecurity} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card className="bg-zinc-800 border-zinc-700 text-white">
            <CardHeader>
              <CardTitle>Cài đặt email</CardTitle>
              <CardDescription className="text-zinc-400">Cấu hình gửi email từ hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cấu hình SMTP</h3>

                <div className="space-y-2">
                  <Label htmlFor="smtp-server">Máy chủ SMTP</Label>
                  <Input
                    id="smtp-server"
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpServer: e.target.value })}
                    className="bg-zinc-700 border-zinc-600 text-white"
                    placeholder="smtp.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Cổng SMTP</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpPort: Number.parseInt(e.target.value) || 587 })
                    }
                    className="bg-zinc-700 border-zinc-600 text-white w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Tên đăng nhập SMTP</Label>
                  <Input
                    id="smtp-username"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                    className="bg-zinc-700 border-zinc-600 text-white"
                    placeholder="username@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Mật khẩu SMTP</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                    className="bg-zinc-700 border-zinc-600 text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Separator className="my-4 bg-zinc-700" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cài đặt người gửi</h3>

                <div className="space-y-2">
                  <Label htmlFor="sender-email">Email người gửi</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-name">Tên người gửi</Label>
                  <Input
                    id="sender-name"
                    value={emailSettings.senderName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>
              </div>

              <Separator className="my-4 bg-zinc-700" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Thông báo</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-email-notifications">Bật thông báo email</Label>
                    <p className="text-sm text-zinc-400">Gửi email thông báo từ hệ thống</p>
                  </div>
                  <Switch
                    id="enable-email-notifications"
                    checked={emailSettings.enableEmailNotifications}
                    onCheckedChange={(checked) =>
                      setEmailSettings({ ...emailSettings, enableEmailNotifications: checked })
                    }
                  />
                </div>

                {emailSettings.enableEmailNotifications && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notify-new-user"
                        checked={emailSettings.notifyOnNewUser}
                        onCheckedChange={(checked) =>
                          setEmailSettings({ ...emailSettings, notifyOnNewUser: checked })
                        }
                      />
                      <Label htmlFor="notify-new-user">Thông báo khi có người dùng mới</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notify-new-playlist"
                        checked={emailSettings.notifyOnNewPlaylist}
                        onCheckedChange={(checked) =>
                          setEmailSettings({ ...emailSettings, notifyOnNewPlaylist: checked })
                        }
                      />
                      <Label htmlFor="notify-new-playlist">Thông báo khi có playlist mới</Label>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveEmail} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
