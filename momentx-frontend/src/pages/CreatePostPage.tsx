import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Image, Video, Camera, MapPin, Users, Hash, 
  Smile, Music2, Sparkles, X, ChevronRight, Upload,
  Loader2, Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const filters = [
  { name: "Original", class: "" },
  { name: "Vivid", class: "saturate-150" },
  { name: "Warm", class: "sepia-[0.3]" },
  { name: "Cool", class: "hue-rotate-15" },
  { name: "B&W", class: "grayscale" },
  { name: "Vintage", class: "sepia-[0.5] contrast-110" },
  { name: "Fade", class: "brightness-110 contrast-90" },
  { name: "Drama", class: "contrast-125 saturate-110" },
];

const sampleImages = [
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600",
];

export default function CreatePostPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"select" | "edit" | "details">("select");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const handleSelectImage = (img: string) => {
    setSelectedImage(img);
    setStep("edit");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setIsPosting(true);
    // Simulate posting
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Post shared successfully!");
    setIsPosting(false);
    navigate("/");
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
            whileHover={{ scale: 1.1 }}
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
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-display font-bold">
              {step === "select" ? "New Post" : step === "edit" ? "Edit Photo" : "Share Post"}
            </h1>
          </div>

          {step !== "select" ? (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                if (step === "edit") setStep("details");
                else handlePost();
              }}
              disabled={isPosting}
              className="min-w-[80px]"
            >
              {isPosting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === "edit" ? (
                "Next"
              ) : (
                "Share"
              )}
            </Button>
          ) : (
            <div className="w-20" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={{ width: "33%" }}
            animate={{ 
              width: step === "select" ? "33%" : step === "edit" ? "66%" : "100%" 
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Media */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 md:p-6 lg:p-8"
            >
              {/* Upload Options */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                {[
                  { icon: Camera, label: "Camera", action: () => fileInputRef.current?.click() },
                  { icon: Image, label: "Gallery", action: () => fileInputRef.current?.click() },
                  { icon: Video, label: "Video", action: () => toast.info("Video upload coming soon!") },
                ].map((option, index) => (
                  <motion.button
                    key={option.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={option.action}
                    className="p-4 md:p-6 lg:p-8 glass-strong rounded-2xl flex flex-col items-center gap-2 md:gap-3 group"
                  >
                    <div className="p-3 md:p-4 bg-gradient-primary/20 rounded-full group-hover:bg-gradient-primary/30 transition-colors">
                      <option.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </div>
                    <span className="text-sm md:text-base font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Drag & Drop Zone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => fileInputRef.current?.click()}
                className="mb-8 p-8 md:p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Drag and drop your files here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                </div>
              </motion.div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Recent Images */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm md:text-base font-medium text-muted-foreground">Recent Photos</h3>
                <span className="text-xs text-muted-foreground">{sampleImages.length} items</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-2">
                {sampleImages.map((img, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.03 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => handleSelectImage(img)}
                    className="aspect-square rounded-lg md:rounded-xl overflow-hidden group relative"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                      <Check className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                ))}
              </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Preview */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="aspect-square rounded-2xl overflow-hidden shadow-2xl"
                >
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className={`w-full h-full object-cover transition-all duration-300 ${selectedFilter}`}
                  />
                </motion.div>

                {/* Filters & Tools */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm md:text-base font-medium text-muted-foreground mb-4">Filters</h3>
                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                      {filters.map((filter, index) => (
                        <motion.button
                          key={filter.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedFilter(filter.class)}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            selectedFilter === filter.class 
                              ? "border-primary shadow-lg shadow-primary/20" 
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}>
                            <img
                              src={selectedImage}
                              alt={filter.name}
                              className={`w-full h-full object-cover ${filter.class}`}
                            />
                          </div>
                          <span className={`text-xs ${selectedFilter === filter.class ? "text-primary font-medium" : ""}`}>
                            {filter.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Edit Tools */}
                  <div>
                    <h3 className="text-sm md:text-base font-medium text-muted-foreground mb-4">Enhance</h3>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { icon: Sparkles, label: "AI Enhance" },
                        { icon: Music2, label: "Add Music" },
                        { icon: Smile, label: "Stickers" },
                      ].map((tool, index) => (
                        <motion.button
                          key={tool.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toast.info(`${tool.label} coming soon!`)}
                          className="flex items-center gap-2 px-4 py-3 glass rounded-xl"
                        >
                          <tool.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">{tool.label}</span>
                        </motion.button>
                      ))}
                    </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Preview */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="aspect-square rounded-2xl overflow-hidden shadow-xl"
                  >
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className={`w-full h-full object-cover ${selectedFilter}`}
                    />
                  </motion.div>
                </div>

                {/* Details Form */}
                <div className="space-y-6">
                  {/* Caption */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Caption</label>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a caption for your post..."
                      className="min-h-[120px] glass-strong border-border/50 focus:border-primary/50 resize-none"
                      maxLength={2200}
                    />
                    <p className="text-xs text-muted-foreground text-right">{caption.length}/2200</p>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowLocationInput(!showLocationInput)}
                      className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <span>Add location</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {location && <span className="text-sm text-primary">{location}</span>}
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showLocationInput ? "rotate-90" : ""}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {showLocationInput && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <Input
                            variant="glass"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter location..."
                            className="mt-2"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowTagInput(!showTagInput)}
                      className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-muted-foreground" />
                        <span>Add hashtags</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tags.length > 0 && <span className="text-sm text-primary">{tags.length} tags</span>}
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showTagInput ? "rotate-90" : ""}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {showTagInput && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          <div className="flex gap-2 mt-2">
                            <Input
                              variant="glass"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                              placeholder="Add a hashtag..."
                              className="flex-1"
                            />
                            <Button variant="glass" onClick={handleAddTag}>Add</Button>
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <motion.span
                                  key={tag}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                                >
                                  #{tag}
                                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                                    <X className="w-3 h-3" />
                                  </button>
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tag People */}
                  <button className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span>Tag people</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {/* Share Options */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Also share to</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Facebook", "Twitter", "LinkedIn", "WhatsApp"].map((platform) => (
                        <motion.button
                          key={platform}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 glass rounded-full text-sm hover:bg-primary/10 transition-colors"
                        >
                          {platform}
                        </motion.button>
                      ))}
                    </div>
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
