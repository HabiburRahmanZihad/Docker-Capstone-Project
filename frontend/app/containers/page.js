"use client";

import { useEffect, useState, useCallback } from "react";
import { Play, Square, RotateCcw, Trash2, Plus, ScrollText, RefreshCw } from "lucide-react";
import { containers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function statusColor(state) {
  if (state === "running") return "default";
  if (state === "exited") return "destructive";
  return "secondary";
}

export default function ContainersPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [logs, setLogs] = useState({ open: false, id: null, text: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ image: "", name: "", hostPort: "", containerPort: "" });
  const [error, setError] = useState(null);

  const fetchContainers = useCallback(async () => {
    try {
      setError(null);
      const res = await containers.list();
      setList(res.data);
    } catch {
      setError("Failed to fetch containers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContainers(); }, [fetchContainers]);

  async function action(id, fn) {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await fn();
      await fetchContainers();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function viewLogs(id) {
    const res = await containers.logs(id);
    setLogs({ open: true, id, text: res.data.logs });
  }

  async function handleCreate() {
    if (!form.image) return alert("Image name is required");
    const ports = form.hostPort && form.containerPort
      ? { [form.hostPort]: form.containerPort }
      : undefined;
    await action("create", () =>
      containers.create({ image: form.image, name: form.name || undefined, ports })
    );
    setCreateOpen(false);
    setForm({ image: "", name: "", hostPort: "", containerPort: "" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Containers</h1>
          <p className="text-gray-500 mt-1">{list.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchContainers}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Container</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run a new container</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1">
                  <Label>Image *</Label>
                  <Input placeholder="nginx:latest" value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <Label>Name (optional)</Label>
                  <Input placeholder="my-container" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label>Host Port</Label>
                    <Input placeholder="8080" value={form.hostPort} onChange={(e) => setForm((p) => ({ ...p, hostPort: e.target.value }))} />
                  </div>
                  <div className="grid gap-1">
                    <Label>Container Port</Label>
                    <Input placeholder="80" value={form.containerPort} onChange={(e) => setForm((p) => ({ ...p, containerPort: e.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate}>Run</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No containers found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Image", "Status", "Ports", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((c) => {
                const name = c.Names?.[0]?.replace("/", "") || c.Id.slice(0, 12);
                const busy = actionLoading[c.Id];
                return (
                  <tr key={c.Id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{c.Image}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColor(c.State)}>{c.State}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.Ports?.filter((p) => p.PublicPort).map((p) => `${p.PublicPort}→${p.PrivatePort}`).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.State !== "running" ? (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" disabled={busy} onClick={() => action(c.Id, () => containers.start(c.Id))}>
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-yellow-600" disabled={busy} onClick={() => action(c.Id, () => containers.stop(c.Id))}>
                            <Square className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" disabled={busy} onClick={() => action(c.Id, () => containers.restart(c.Id))}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500" onClick={() => viewLogs(c.Id)}>
                          <ScrollText className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" disabled={busy} onClick={() => action(c.Id, () => containers.remove(c.Id))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={logs.open} onOpenChange={(o) => setLogs((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Logs — {logs.id?.slice(0, 12)}</DialogTitle>
          </DialogHeader>
          <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap font-mono">
            {logs.text || "No logs available"}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
