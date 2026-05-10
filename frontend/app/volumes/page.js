"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, RefreshCw, Plus } from "lucide-react";
import { volumes } from "@/lib/api";
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

export default function VolumesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", driver: "local" });
  const [error, setError] = useState(null);

  const fetchVolumes = useCallback(async () => {
    try {
      setError(null);
      const res = await volumes.list();
      setList(res.data);
    } catch {
      setError("Failed to fetch volumes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVolumes(); }, [fetchVolumes]);

  async function handleRemove(name) {
    setBusy((p) => ({ ...p, [name]: true }));
    try {
      await volumes.remove(name);
      await fetchVolumes();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setBusy((p) => ({ ...p, [name]: false }));
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) return alert("Volume name is required");
    try {
      await volumes.create({ name: form.name.trim(), driver: form.driver });
      await fetchVolumes();
      setCreateOpen(false);
      setForm({ name: "", driver: "local" });
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  async function handlePrune() {
    if (!confirm("Remove all unused volumes? This cannot be undone.")) return;
    try {
      const res = await volumes.prune();
      alert(`Pruned ${res.data?.VolumesDeleted?.length || 0} volumes`);
      await fetchVolumes();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volumes</h1>
          <p className="text-gray-500 mt-1">{list.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchVolumes}>
            <RefreshCw className="size-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handlePrune}>
            Prune Unused
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="size-3.5 mr-1" /> New Volume
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Volume</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label>Name *</Label>
                  <Input placeholder="my-data" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Driver</Label>
                  <Input placeholder="local" value={form.driver} onChange={(e) => setForm((p) => ({ ...p, driver: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No volumes found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Driver", "Mountpoint", "Scope", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((v) => (
                <tr key={v.Name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{v.Name}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{v.Driver}</Badge></td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono max-w-[260px] truncate">{v.Mountpoint}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{v.Scope}</td>
                  <td className="px-4 py-3">
                    <Button size="icon-sm" variant="ghost" className="text-red-500"
                      disabled={busy[v.Name]} onClick={() => handleRemove(v.Name)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
