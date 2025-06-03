"use client"

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user } = useAuth();
    const router = useRouter();

    // Nếu người dùng đã đăng nhập, chuyển hướng về trang chủ
    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    return (
        <div className="flex min-h-screen bg-black">
            {/* Left side - Brand/Intro */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-900 to-black flex-col justify-center items-center p-8">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center mb-8">
                        <Image src="/spotify-logo.svg" alt="Spotify" width={50} height={50} />
                        <h1 className="text-white text-3xl font-bold ml-2">Spotify Clone</h1>
                    </div>
                    <p className="text-white/80 text-xl mb-6">
                        Khám phá thế giới âm nhạc không giới hạn với trải nghiệm nghe nhạc tuyệt vời.
                    </p>
                    <ul className="text-white/70 space-y-4">
                        <li className="flex items-center">
                            <span className="bg-green-500 rounded-full p-1 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            Nghe không giới hạn các bài hát, album và playlist
                        </li>
                        <li className="flex items-center">
                            <span className="bg-green-500 rounded-full p-1 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            Tạo và chia sẻ playlist cá nhân của bạn
                        </li>
                        <li className="flex items-center">
                            <span className="bg-green-500 rounded-full p-1 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            Nhắn tin và chia sẻ âm nhạc với bạn bè
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right side - Auth forms */}
            <div className="w-full md:w-1/2 flex justify-center items-center p-8">
                <div className="max-w-md w-full">
                    <Button
                        variant="ghost"
                        className="flex items-center text-white hover:text-green-500 hover:bg-transparent p-0 mb-8"
                        onClick={() => router.push('/')}
                    >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        <span>Quay lại trang chủ</span>
                    </Button>

                    {children}
                    <div className="mt-8 text-center text-zinc-400 text-sm">
                        <p>© 2024 Spotify Clone. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 