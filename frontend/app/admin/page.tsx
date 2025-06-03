"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Music, Disc, ListMusic, Clock, Activity } from "lucide-react"
import { api } from "@/lib/api"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts"

interface AdminStats {
  overview?: {
    total_users: number;
    active_users: number;
    total_songs: number;
    total_playlists: number;
    total_plays: number;
  };
  genre_stats?: Record<string, {
    song_count: number;
    total_plays: number;
    avg_plays: number;
  }>;
  monthly_plays?: Record<string, number>;
  top_songs?: Array<any>;
  top_playlists?: Array<any>;
  new_users?: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await api.admin.getStatistics()
        setStats(response)
      } catch (error) {
        console.error("Error fetching admin statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Chuyển đổi dữ liệu genre_stats từ object sang array cho biểu đồ
  const genreChartData = stats?.genre_stats
    ? Object.entries(stats.genre_stats).map(([name, data]) => ({
      name,
      value: data.song_count,
      plays: data.total_plays
    }))
    : []

  // Chuyển đổi dữ liệu monthly_plays từ object sang array cho biểu đồ
  const monthlyPlaysData = stats?.monthly_plays
    ? Object.entries(stats.monthly_plays).map(([date, count]) => ({
      date,
      plays: count
    }))
    : []

  // Tính tổng số người dùng mới từ đối tượng new_users
  const totalNewUsers = stats?.new_users
    ? Object.values(stats.new_users).reduce((sum, count) => sum + (count as number), 0)
    : 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Bảng điều khiển quản trị</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-t-2 border-green-500 rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Thống kê tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview?.total_users || 0}</div>
                <p className="text-xs text-zinc-400 mt-1">
                  <span className="text-green-500">{stats?.overview?.active_users || 0}</span> đang hoạt động
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng bài hát</CardTitle>
                <Music className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview?.total_songs || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng playlist</CardTitle>
                <ListMusic className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview?.total_playlists || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng lượt nghe</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview?.total_plays || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Người dùng mới</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNewUsers}</div>
                <p className="text-xs text-zinc-400 mt-1">Trong 30 ngày qua</p>
              </CardContent>
            </Card>
          </div>

          {/* Biểu đồ lượt nghe theo ngày */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader>
                <CardTitle>Lượt nghe theo ngày</CardTitle>
                <CardDescription className="text-zinc-400">30 ngày qua</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {monthlyPlaysData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyPlaysData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#333', border: 'none' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="plays" stroke="#1DB954" fill="#1DB95433" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    Không có dữ liệu để hiển thị
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Biểu đồ thể loại */}
            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader>
                <CardTitle>Thống kê thể loại</CardTitle>
                <CardDescription className="text-zinc-400">Phân bố bài hát theo thể loại</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {genreChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {genreChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#333', border: 'none' }}
                        formatter={(value, name, props) => [`${value} bài hát`, props.payload.name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    Không có dữ liệu để hiển thị
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top bài hát và Playlist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader>
                <CardTitle>Top bài hát</CardTitle>
                <CardDescription className="text-zinc-400">Bài hát được nghe nhiều nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.top_songs?.slice(0, 5).map((song: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="text-zinc-400">{i + 1}</div>
                        <div>
                          <p className="font-medium">{song.title}</p>
                          <p className="text-xs text-zinc-400">{song.artist}</p>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-400">{song.total_plays} lượt nghe</div>
                    </div>
                  ))}

                  {(!stats?.top_songs || stats.top_songs.length === 0) && (
                    <div className="text-center text-zinc-500 py-6">Không có dữ liệu</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 text-white">
              <CardHeader>
                <CardTitle>Top playlist</CardTitle>
                <CardDescription className="text-zinc-400">Playlist được nghe nhiều nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.top_playlists?.slice(0, 5).map((playlist: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="text-zinc-400">{i + 1}</div>
                        <div>
                          <p className="font-medium">{playlist.name}</p>
                          <p className="text-xs text-zinc-400">{playlist.owner}</p>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-400">{playlist.plays} lượt nghe</div>
                    </div>
                  ))}

                  {(!stats?.top_playlists || stats.top_playlists.length === 0) && (
                    <div className="text-center text-zinc-500 py-6">Không có dữ liệu</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
