import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Image, Video, Camera, MapPin, Hash,
  ChevronRight, Upload, Loader2, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/axios"; // Import Axios

const filters = [
  { name: "Original", class: "" },
  { name: "Vivid", class: "saturate-150" },
  { name: "Warm", class: "sepia-[0.3]" },
  { name: "Cool", class: "hue-rotate-15" },
  { name: "B&W", class: "grayscale" },
  { name: "Vintage", class: "sepia-[0.5] contrast-110" },
];

export default function CreatePostPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"select" | "edit" | "details">("select");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); // ✅ Store actual file

  const [selectedFilter, setSelectedFilter] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file); // ✅ Save file for upload
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim().replace(/^#/, "")]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handlePost = async () => {
    if (!imageFile) return;
    setIsPosting(true);

    try {
      const formData = new FormData();
      formData.append("images", imageFile);

      const finalCaption = `${caption} ${tags.map(t => `#${t}`).join(" ")}`;
      formData.append("caption", finalCaption);

      if (location) formData.append("location", location);

      await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post shared successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Post Error:", error);
      toast.error("Failed to share post", {
        description: error.response?.data?.message || "Something went wrong"
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 glass-strong border-b border-border"
      >
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (step === "select") navigate(-1);
              else if (step === "edit") setStep("select");
              else setStep("edit");
            }}
            className="p-2 glass rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <h1 className="text-lg md:text-xl font-display font-bold">
            {step === "select" ? "New Post" : step === "edit" ? "Edit Photo" : "Share Post"}
          </h1>

          {step !== "select" ? (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                if (step === "edit") setStep("details");
                else handlePost();
              }}
              disabled={isPosting}
              className="min-w-20" // ✅ Fixed class
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : step === "edit" ? "Next" : "Share"}
            </Button>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">

          {/* Step 1: Select */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 md:p-6 lg:p-8"
            >
              {/* Options */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                <button onClick={() => fileInputRef.current?.click()} className="p-6 glass-strong rounded-2xl flex flex-col items-center gap-2">
                  <Image className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium">Gallery</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-6 glass-strong rounded-2xl flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium">Camera</span>
                </button>
                <button onClick={() => toast.info("Coming soon!")} className="p-6 glass-strong rounded-2xl flex flex-col items-center gap-2 opacity-50">
                  <Video className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium">Video</span>
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/5 transition-all"
              >
                <Upload className="w-12 h-12 text-muted-foreground" />
                <p className="font-medium">Click to Upload Image</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 2: Edit */}
          {step === "edit" && selectedImage && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 md:p-6 lg:p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  <img src={selectedImage} alt="Preview" className={`w-full h-full object-cover ${selectedFilter}`} />
                </div>
                <div>
                  <h3 className="mb-4 font-medium">Filters</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {filters.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => setSelectedFilter(f.class)}
                        className={`p-2 rounded-xl border-2 ${selectedFilter === f.class ? "border-primary" : "border-transparent"}`}
                      >
                        <img src={selectedImage} className={`w-full h-20 object-cover rounded-lg mb-2 ${f.class}`} alt={f.name} />
                        <span className="text-xs">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Details */}
          {step === "details" && selectedImage && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 md:p-6 lg:p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl h-64 lg:h-auto mx-auto lg:mx-0 w-64 lg:w-full">
                  <img src={selectedImage} alt="Final" className={`w-full h-full object-cover ${selectedFilter}`} />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Caption</label>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a caption..."
                      className="min-h-32 glass-strong resize-none" // ✅ Fixed class
                    />
                  </div>

                  {/* Location Toggle */}
                  <div className="space-y-2">
                    <button onClick={() => setShowLocationInput(!showLocationInput)} className="w-full flex items-center justify-between p-4 glass rounded-xl">
                      <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> <span>Add Location</span></div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {showLocationInput && (
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, USA" />
                    )}
                  </div>

                  {/* Tags Toggle */}
                  <div className="space-y-2">
                    <button onClick={() => setShowTagInput(!showTagInput)} className="w-full flex items-center justify-between p-4 glass rounded-xl">
                      <div className="flex items-center gap-2"><Hash className="w-5 h-5" /> <span>Add Tags</span></div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {showTagInput && (
                      <div>
                        <div className="flex gap-2 mb-2">
                          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="nature" />
                          <Button onClick={handleAddTag} size="sm">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.map(t => (
                            <span key={t} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1">
                              #{t} <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(t)} />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}