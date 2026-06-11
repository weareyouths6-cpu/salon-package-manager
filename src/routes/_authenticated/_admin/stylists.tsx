import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

export const Route = createFileRoute("/_authenticated/_admin/stylists")({
  component: StylistsAdmin,
});

type FormState = { id?: string; name: string; specialty: string; photo_url: string | null };
const empty: FormState = { name: "", specialty: "", photo_url: null };

function StylistsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const { data } = useQuery({
    queryKey: ["stylists-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stylists").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const path = `stylist-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("stylist-photos").upload(path, file);
    if (error) return toast.error(error.message);
    setForm((f) => ({ ...f, photo_url: path }));
  }

  async function save() {
    const p = { name: form.name, specialty: form.specialty, photo_url: form.photo_url };
    const { error } = form.id
      ? await supabase.from("stylists").update(p).eq("id", form.id)
      : await supabase.from("stylists").insert(p);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["stylists-admin"] });
  }
  async function remove(id: string) {
    if (!confirm("Delete this stylist?")) return;
    const { error } = await supabase.from("stylists").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["stylists-admin"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Stylists</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(empty); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Stylist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit" : "New"} stylist</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Photo</Label>
                <input type="file" accept="image/*" onChange={upload} />
                {form.photo_url && (
                  <SignedImage bucket="stylist-photos" path={form.photo_url} alt="" className="h-20 w-20 rounded-full object-cover mt-2" />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-3 py-3">
              <SignedImage
                bucket="stylist-photos"
                path={s.photo_url}
                alt={s.name}
                className="h-14 w-14 rounded-full object-cover"
                fallback={<div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{s.name[0]}</div>}
              />
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.specialty}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setForm(s); setOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
