"use client";

import { useEffect, useState } from "react";
import { Box, HardDrive, Network, Image, Activity } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { containers, volumes, networks, images } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [c, v, n, i] = await Promise.all([
          containers.list(),
          volumes.list(),
          networks.list(),
          images.list(),
        ]);

        const containerList = c.data;
        const running = containerList.filter((c) => c.State === "running").length;

        setStats({
          total: containerList.length,
          running,
          stopped: containerList.length - running,
          volumes: v.data.length,
          networks: n.data.length,
          images: i.data.length,
        });
      } catch {
        setError("Could not connect to Docker backend. Is the server running?");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your Docker environment</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Total Containers" value={stats?.total} icon={Box} color="blue" />
          <StatsCard title="Running" value={stats?.running} icon={Activity} color="green" subtitle="Actively running containers" />
          <StatsCard title="Stopped" value={stats?.stopped} icon={Box} color="red" subtitle="Exited / stopped containers" />
          <StatsCard title="Images" value={stats?.images} icon={Image} color="purple" />
          <StatsCard title="Volumes" value={stats?.volumes} icon={HardDrive} color="yellow" />
          <StatsCard title="Networks" value={stats?.networks} icon={Network} color="blue" />
        </div>
      )}
    </div>
  );
}
