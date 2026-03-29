import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Category, ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";

interface ComplaintFormProps {
  defaultCategory?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: Category.water_leakage, label: "Water Leakage" },
  { value: Category.drainage, label: "Drainage & Sewage" },
  { value: Category.road_damage, label: "Road Damage" },
  { value: Category.garbage, label: "Garbage & Waste" },
  { value: Category.electricity, label: "Electricity" },
  { value: Category.other, label: "Other" },
];

export function ComplaintForm({
  defaultCategory,
  onSuccess,
  onCancel,
}: ComplaintFormProps) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(
    defaultCategory ?? Category.water_leakage,
  );
  const [area, setArea] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (!title.trim() || !description.trim() || !area.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let photo: ExternalBlob | undefined;
      if (photoFile) {
        const bytes = new Uint8Array(await photoFile.arrayBuffer());
        photo = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
          setUploadProgress(p),
        );
      }

      await actor.submitComplaint({
        title,
        description,
        category,
        area,
        photo,
      });
      toast.success("Complaint submitted successfully!");
      qc.invalidateQueries({ queryKey: ["myComplaints"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to submit complaint. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="complaint-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="complaint-title"
          data-ocid="complaint.input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the issue"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="complaint-category">
          Category <span className="text-destructive">*</span>
        </Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as Category)}
        >
          <SelectTrigger data-ocid="complaint.select" id="complaint-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="complaint-area">
          Area / Location <span className="text-destructive">*</span>
        </Label>
        <Input
          id="complaint-area"
          data-ocid="complaint.area.input"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Ward 5, MG Road, Near Town Hall"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="complaint-description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="complaint-description"
          data-ocid="complaint.textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide detailed information about the issue..."
          className="min-h-[100px] resize-none"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Photo (Optional)</Label>
        {photoPreview ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={photoPreview}
              alt="Preview"
              className="w-full max-h-48 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-2 right-2 w-6 h-6 bg-foreground/80 text-white rounded-full flex items-center justify-center hover:bg-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label
            data-ocid="complaint.upload_button"
            className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            <Upload className="w-7 h-7 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to upload a photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        )}
      </div>

      {isSubmitting && uploadProgress > 0 && (
        <div className="text-sm text-muted-foreground">
          Uploading photo: {uploadProgress}%
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            data-ocid="complaint.cancel_button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          data-ocid="complaint.submit_button"
          disabled={isSubmitting}
          className="flex-1 bg-primary text-primary-foreground"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Complaint"
          )}
        </Button>
      </div>
    </form>
  );
}
