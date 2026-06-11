import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { SignedImage } from "@/lib/signed-image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/packages")({
  component: PackagesAdmin,
});

type FormState = {
  id?: string;
  name: string;
  description: string;
  total_sessions: number;
  price: number;
  image_url: string | null;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  total_sessions: 1,
  price: 0,
  image_url: null,
  is_active: true,
};

function PackagesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data } = useQuery({
    queryKey: ["packages-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(p: any) {
    setForm({ ...p });
    setOpen(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const path = `pkg-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("package-images").upload(path, file);
    if (error) return toast.error(error.message);
    setForm((f) => ({ ...f, image_url: path }));
    toast.success("Image uploaded");
  }

  async function save() {
    const payload = {
      name: form.name,
      description: form.description,
      total_sessions: form.total_sessions,
      price: form.price,
      image_url: form.image_url,
      is_active: form.is_active,
    };
    const { error } = form.id
      ? await supabase.from("packages").update(payload).eq("id", form.id)
      : await supabase.from("packages").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["packages-admin"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this package?")) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages-admin"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Packages</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> New Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit" : "New"} package</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Total sessions</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.total_sessions}
                    onChange={(e) => setForm({ ...form, total_sessions: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <input type="file" accept="image/*" onChange={handleUpload} />
                {form.image_url && (
                  <SignedImage bucket="package-images" path={form.image_url} alt="" className="h-24 mt-2 rounded" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((p: any) => (
          <Card key={p.id} className="overflow-hidden">
            <SignedImage
              bucket="package-images"
              path={p.image_url}
              alt={p.name}
              className="h-28 w-full object-cover"
              fallback={<div className="h-28 w-full bg-muted" />}
            />
            <CardContent className="py-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.total_sessions} sessions • ${p.price}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
