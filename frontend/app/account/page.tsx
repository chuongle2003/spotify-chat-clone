"use client"
import { useState } from "react"
import { ChevronRight, Search, Edit, RefreshCw, CreditCard, ChevronDown, ArrowLeft, Camera } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function AccountPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    bio: user?.bio || "Nhạc sĩ và người hâm mộ âm nhạc",
  })
  const [profileImage, setProfileImage] = useState(user?.profile_image || "/placeholder.svg?height=200&width=200")

  const handleProfileDataChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      // In a real app, you would upload this file to your server
      const imageUrl = URL.createObjectURL(files[0])
      setProfileImage(imageUrl)
    }
  }

  const handleSaveProfile = async () => {
    // In a real app, you would call an API to update the user profile
    // For now, we'll just toggle back to the view mode
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-black/90">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              className="text-white hover:text-white hover:bg-transparent"
              onClick={() => setIsEditing(false)}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-green-500 hover:bg-green-600 text-black" onClick={handleSaveProfile}>
              Lưu
            </Button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">Chỉnh sửa hồ sơ</h1>

          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden relative">
                  <Image src={profileImage || "/placeholder.svg"} alt="Profile" className="object-cover" fill />
                </div>
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-black" />
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Tên</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileDataChange}
                    className="bg-zinc-800 border-none"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Họ</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileDataChange}
                    className="bg-zinc-800 border-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">Tên người dùng</Label>
                <Input
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileDataChange}
                  className="bg-zinc-800 border-none"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Tên người dùng sẽ xuất hiện trên trang hồ sơ của bạn và trong các playlist được chia sẻ.
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileDataChange}
                  className="bg-zinc-800 border-none"
                />
              </div>

              <div>
                <Label htmlFor="bio">Tiểu sử</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileDataChange}
                  className="bg-zinc-800 border-none h-24"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Viết một đoạn ngắn về bản thân bạn. Nó sẽ xuất hiện trên trang hồ sơ của bạn.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-black/90">
        <div className="flex items-center gap-6">
          <Link href="/">
            <svg viewBox="0 0 78 24" width="78" height="24" className="text-white">
              <path
                fill="currentColor"
                d="M18.616 10.639c-3.77-2.297-9.99-2.509-13.59-1.388a1.077 1.077 0 0 1-1.164-.363 1.14 1.14 0 0 1-.119-1.237c.136-.262.37-.46.648-.548 4.132-1.287 11-1.038 15.342 1.605a1.138 1.138 0 0 1 .099 1.863 1.081 1.081 0 0 1-.813.213c-.142-.02-.28-.07-.403-.145Zm-.124 3.402a.915.915 0 0 1-.563.42.894.894 0 0 1-.69-.112c-3.144-1.983-7.937-2.557-11.657-1.398a.898.898 0 0 1-.971-.303.952.952 0 0 1-.098-1.03.929.929 0 0 1 .54-.458c4.248-1.323 9.53-.682 13.14 1.595a.95.95 0 0 1 .3 1.286Zm-1.43 3.267a.73.73 0 0 1-.45.338.712.712 0 0 1-.553-.089c-2.748-1.722-6.204-2.111-10.276-1.156a.718.718 0 0 1-.758-.298.745.745 0 0 1-.115-.265.757.757 0 0 1 .092-.563.737.737 0 0 1 .457-.333c4.455-1.045 8.277-.595 11.361 1.338a.762.762 0 0 1 .241 1.028ZM11.696 0C5.237 0 0 5.373 0 12c0 6.628 5.236 12 11.697 12 6.46 0 11.698-5.372 11.698-12 0-6.627-5.238-12-11.699-12h.001Z"
              />
            </svg>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-transparent">
            Hỗ trợ
          </Button>
          <Button variant="ghost" className="text-white hover:text-white hover:bg-transparent">
            Tải xuống
          </Button>
          <div className="h-6 w-px bg-white/30 mx-2"></div>
          <div className="flex items-center gap-2">
            <Image
              src={user?.profile_image || "/placeholder.svg?height=32&width=32"}
              width={32}
              height={32}
              alt="Profile"
              className="rounded-full"
            />
            <span className="text-sm font-medium">{user?.username || "Người dùng"}</span>
            <ChevronDown className="h-4 w-4 text-white/70" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4">
        {/* Search bar */}
        <div className="relative mb-8 max-w-3xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            placeholder="Tìm kiếm tài khoản hoặc bài viết trợ giúp"
            className="pl-10 bg-zinc-800 border-none h-12 text-white focus-visible:ring-0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile info section */}
          <div className="col-span-2 bg-zinc-900 rounded-lg p-6">
            <div className="flex items-start gap-6">
              <Image
                src={user?.profile_image || "/placeholder.svg?height=120&width=120"}
                width={120}
                height={120}
                alt="Profile"
                className="rounded-full"
              />
              <div>
                <h2 className="text-2xl font-bold mb-1">{user?.username || "Người dùng"}</h2>
                <p className="text-white/70">{user?.email || "user@example.com"}</p>
                <p className="text-white/70 mt-2">
                  {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : ""}
                </p>
                <p className="text-white/70 mt-1">{profileData.bio || "Nhạc sĩ và người hâm mộ âm nhạc"}</p>
              </div>
            </div>
            
          </div>
          
          {/* Profile edit section */}
          <div
            className="bg-zinc-900 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/80 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <div className="mb-4">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-1">Chỉnh sửa hồ sơ</h3>
            <p className="text-sm text-white/70 text-center">Thay đổi avatar và chi tiết hồ sơ của bạn</p>
          </div>


          {/* Account section */}
          <div className="col-span-full bg-zinc-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Tài khoản</h2>

            <div className="space-y-4">
              <div
                className="flex items-center justify-between p-3 hover:bg-zinc-800 rounded-md cursor-pointer transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <div className="flex items-center">
                  <Edit className="h-5 w-5 mr-4 text-white/70" />
                  <span>Chỉnh sửa danh sách </span>
                </div>
                <ChevronRight className="h-5 w-5 text-white/70" />
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-zinc-800 rounded-md cursor-pointer transition-colors">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-4 text-white/70" />
                  <span>Khôi phục danh sách phát</span>
                </div>
                <ChevronRight className="h-5 w-5 text-white/70" />
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-zinc-800 rounded-md cursor-pointer transition-colors">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-4 text-white/70" />
                  <span>Lịch sử thanh toán</span>
                </div>
                <ChevronRight className="h-5 w-5 text-white/70" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
