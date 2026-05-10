"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Download, RefreshCw, Plus } from "lucide-react";
import { images } from "@/lib/api";
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

function formatSize(bytes) {
  if (!bytes) return "—";
  const mb = bytes / 1024 / 1024;
  return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

export default function ImagesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [pullOpen, setPullOpen] = useState(false);
  const [pullImage, setPullImage] = useState("");
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState(null);

  const fetchImages = useCallback(async () => {
    try {
      setError(null);
      const res = await images.list();
      setList(res.data);
    } catch {
      setError("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  async function handleRemove(id) {
    setBusy((p) => ({ ...p, [id]: true }));
    try {
      await images.remove(id);
      await fetchImages();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setBusy((p) => ({ ...p, [id]: false }));
    }
  }

  async function handlePull() {
    if (!pullImage.trim()) return;
    setPulling(true);
    try {
      await images.pull(pullImage.trim());
      await fetchImages();
      setPullOpen(false);
      setPullImage("");
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setPulling(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Images</h1>
          <p className="text-gray-500 mt-1">{list.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchImages}>
            <RefreshCw className="size-3.5 mr-1" /> Refresh
          </Button>
          <Dialog open={pullOpen} onOpenChange={setPullOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="size-3.5 mr-1" /> Pull Image
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Pull Image from Registry</DialogTitle></DialogHeader>
              <div className="grid gap-2 py-2">
                <Label>Image name</Label>
                <Input
                  placeholder="nginx:latest"
                  value={pullImage}
                  onChange={(e) => setPullImage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePull()}
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button onClick={handlePull} disabled={pulling}>
                  <Download className="size-3.5 mr-1" />
                  {pulling ? "Pulling…" : "Pull"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No images found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Repository", "Tag", "Image ID", "Size", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((img) => {
                const repo = img.RepoTags?.[0] || "<none>:<none>";
                const [name, tag] = repo.split(":");
                return (
                  <tr key={img.Id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">{name}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{tag || "none"}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{img.Id.replace("sha256:", "").slice(0, 12)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatSize(img.Size)}</td>
                    <td className="px-4 py-3">
                      <Button size="icon-sm" variant="ghost" className="text-red-500"
                        disabled={busy[img.Id]} onClick={() => handleRemove(img.Id)}>
                        <Trash2 className="size-3.5" />
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
