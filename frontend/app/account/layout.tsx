import type React from "react"

export const metadata = {
  title: "Tài khoản - Spotify",
  description: "Quản lý tài khoản Spotify của bạn",
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="bg-black text-white">{children}</div>
}
