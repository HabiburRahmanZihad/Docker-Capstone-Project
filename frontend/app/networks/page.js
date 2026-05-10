"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, RefreshCw, Plus, ChevronDown } from "lucide-react";
import { networks } from "@/lib/api";
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

function driverColor(driver) {
  if (driver === "bridge") return "default";
  if (driver === "host") return "secondary";
  if (driver === "null") return "destructive";
  return "outline";
}

export default function NetworksPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", driver: "bridge" });
  const [error, setError] = useState(null);

  const fetchNetworks = useCallback(async () => {
    try {
      setError(null);
      const res = await networks.list();
      setList(res.data);
    } catch {
      setError("Failed to fetch networks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNetworks(); }, [fetchNetworks]);

  async function handleRemove(id) {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await networks.remove(id);
      await fetchNetworks();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) return alert("Network name is required");
    try {
      await networks.create({ name: form.name.trim(), driver: form.driver });
      await fetchNetworks();
      setCreateOpen(false);
      setForm({ name: "", driver: "bridge" });
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  async function handlePrune() {
    if (!confirm("Remove all unused networks?")) return;
    try {
      const res = await networks.prune();
      alert(`Pruned ${res.data?.NetworksDeleted?.length || 0} networks`);
      await fetchNetworks();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  const builtIn = ["bridge", "host", "none"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Networks</h1>
          <p className="text-gray-500 mt-1">{list.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNetworks}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handlePrune}>
            Prune Unused
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Network</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Network</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1">
                  <Label>Name *</Label>
                  <Input placeholder="my-network" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <Label>Driver</Label>
                  <Input placeholder="bridge" value={form.driver} onChange={(e) => setForm((p) => ({ ...p, driver: e.target.value }))} />
                  <p className="text-xs text-gray-400">Options: bridge, host, overlay, macvlan</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No networks found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Driver", "Scope", "ID", "Containers", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((n) => {
                const containerCount = Object.keys(n.Containers || {}).length;
                const isBuiltIn = builtIn.includes(n.Name);
                return (
                  <tr key={n.Id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{n.Name}</td>
                    <td className="px-4 py-3"><Badge variant={driverColor(n.Driver)}>{n.Driver}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{n.Scope}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{n.Id.slice(0, 12)}</td>
                    <td className="px-4 py-3 text-gray-600">{containerCount}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                        disabled={actionLoading[n.Id] || isBuiltIn}
                        title={isBuiltIn ? "Built-in network cannot be removed" : "Remove"}
                        onClick={() => handleRemove(n.Id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
