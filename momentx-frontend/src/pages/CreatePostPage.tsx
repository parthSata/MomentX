import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Image, Camera, MapPin, Hash,
  ChevronRight, Upload, Loader2, X, Film, RefreshCcw, Navigation, UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring"; // Assumed existing component
import { toast } from "sonner";
import { api } from "@/lib/axios";

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

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Steps
  const [step, setStep] = useState<"select" | "camera" | "edit" | "details">("select");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Camera State
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Post Details State
  const [selectedFilter, setSelectedFilter] = useState("");
  const [caption, setCaption] = useState("");

  // Location State
  const [location, setLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // ✅ NEW: Tagging State
  const [taggedUsers, setTaggedUsers] = useState<any[]>([]); // Full user objects
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showUserTagInput, setShowUserTagInput] = useState(false);

  // --- USER TAGGING LOGIC ---
  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchQuery.length < 2) {
        setUserSuggestions([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const { data } = await api.get(`/users/search?query=${userSearchQuery}`);
        setUserSuggestions(data.data || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 400);
    return () => clearTimeout(timeoutId);
  }, [userSearchQuery]);

  const toggleTagUser = (user: any) => {
    if (taggedUsers.find(u => u._id === user._id)) {
      setTaggedUsers(taggedUsers.filter(u => u._id !== user._id));
    } else {
      setTaggedUsers([...taggedUsers, user]);
    }
    setUserSearchQuery("");
    setUserSuggestions([]);
  };

  // --- LOCATION LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (location.length > 2 && showLocationInput) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}&limit=5`);
          const data = await res.json();
          setLocationSuggestions(data);
          setShowLocationSuggestions(true);
        } catch (error) {
          console.error("Location search failed", error);
        }
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [location, showLocationInput]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village;
        const country = data.address.country;
        const displayName = city ? `${city}, ${country}` : data.display_name;

        setLocation(displayName);
        setShowLocationSuggestions(false);
        toast.success("Location updated");
      } catch (error) {
        toast.error("Failed to fetch location details");
      } finally {
        setIsFetchingLocation(false);
      }
    }, () => {
      toast.error("Unable to retrieve location");
      setIsFetchingLocation(false);
    });
  };

  const selectLocation = (name: string) => {
    setLocation(name);
    setShowLocationSuggestions(false);
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setStep("camera");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Could not access camera");
      setStep("select");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  useEffect(() => {
    if (step === "camera") startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        if (facingMode === "user") {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            setImageFile(file);
            setSelectedImage(URL.createObjectURL(blob));
            stopCamera();
            setStep("edit");
          }
        }, "image/jpeg");
      }
    }
  };

  // --- FILE UPLOAD LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
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

  // ✅ UPDATED POST HANDLER
  const handlePost = async () => {
    if (!imageFile) return;
    setIsPosting(true);

    try {
      const formData = new FormData();
      formData.append("images", imageFile);

      // Separate the caption from hashtags for cleaner DB storage
      const finalCaption = caption;
      formData.append("caption", finalCaption);
      formData.append("hashtags", tags.join(","));

      if (location) formData.append("location", location);

      // ✅ Send IDs as stringified JSON
      if (taggedUsers.length > 0) {
        formData.append("taggedUsers", JSON.stringify(taggedUsers.map(u => u._id)));
      }

      await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post shared successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Post Error:", error);
      toast.error("Failed to share post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      {step !== "camera" && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 glass-strong border-b border-border">
          <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => step === "select" ? navigate(-1) : step === "edit" ? setStep("select") : setStep("edit")} className="p-2 glass rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-lg md:text-xl font-display font-bold">
              {step === "select" ? "New Post" : step === "edit" ? "Edit Photo" : "Share Post"}
            </h1>
            {step !== "select" ? (
              <Button variant="gradient" size="sm" onClick={() => step === "edit" ? setStep("details") : handlePost()} disabled={isPosting} className="min-w-20">
                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : step === "edit" ? "Next" : "Share"}
              </Button>
            ) : <div className="w-20" />}
          </div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                <button onClick={() => fileInputRef.current?.click()} className="p-6 glass-strong rounded-2xl flex flex-col items-center gap-2 hover:bg-muted/20 transition-colors">
                  <Image className="w-8 h-8 text-primary" /><span className="text-sm font-medium">Gallery</span>
                </button>
                <button onClick={startCamera} className="p-6 glass-strong rounded-2xl flex flex-col items-center gap-2 hover:bg-muted/20 transition-colors">
                  <Camera className="w-8 h-8 text-primary" /><span className="text-sm font-medium">Camera</span>
                </button>
                <button onClick={() => navigate("/create-reel")} className="p-6 glass-strong rounded-2xl flex flex-col items-center gap-2 hover:bg-muted/20 transition-colors">
                  <Film className="w-8 h-8 text-primary" /><span className="text-sm font-medium">Reel</span>
                </button>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/5 transition-all">
                <Upload className="w-12 h-12 text-muted-foreground" /><p className="font-medium">Click to Upload Image</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </motion.div>
          )}

          {step === "camera" && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50 flex flex-col">
              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`} />
                <button onClick={() => { stopCamera(); setStep("select"); }} className="absolute top-6 left-6 p-2 bg-black/40 rounded-full text-white backdrop-blur-md">
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-10 left-0 right-0 flex items-center justify-between px-12">
                  <div className="w-10" />
                  <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-95 transition-transform"><div className="w-16 h-16 bg-white rounded-full" /></button>
                  <button onClick={toggleCamera} className="p-3 bg-black/40 rounded-full text-white backdrop-blur-md"><RefreshCcw className="w-6 h-6" /></button>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

          {step === "edit" && selectedImage && (
            <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl"><img src={selectedImage} alt="Preview" className={`w-full h-full object-cover ${selectedFilter}`} /></div>
                <div><h3 className="mb-4 font-medium">Filters</h3><div className="grid grid-cols-3 gap-3">{filters.map((f) => (<button key={f.name} onClick={() => setSelectedFilter(f.class)} className={`p-2 rounded-xl border-2 ${selectedFilter === f.class ? "border-primary" : "border-transparent"}`}><img src={selectedImage} className={`w-full h-20 object-cover rounded-lg mb-2 ${f.class}`} alt={f.name} /><span className="text-xs">{f.name}</span></button>))}</div></div>
              </div>
            </motion.div>
          )}

          {step === "details" && selectedImage && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl h-64 lg:h-auto mx-auto lg:mx-0 w-64 lg:w-full">
                  <img src={selectedImage} alt="Final" className={`w-full h-full object-cover ${selectedFilter}`} />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Caption</label>
                    <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." className="min-h-32 glass-strong resize-none" />
                  </div>

                  {/* LOCATION */}
                  <div className="space-y-2 relative">
                    <button onClick={() => setShowLocationInput(!showLocationInput)} className="w-full flex items-center justify-between p-4 glass rounded-xl">
                      <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> <span>Add Location</span></div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showLocationInput ? 'rotate-90' : ''}`} />
                    </button>
                    {showLocationInput && (
                      <div className="relative">
                        <Input value={location} onChange={(e) => { setLocation(e.target.value); setShowLocationSuggestions(true); }} placeholder="New York, USA" className="pr-10" />
                        <button onClick={handleGetCurrentLocation} disabled={isFetchingLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">{isFetchingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 fill-current" />}</button>
                        {showLocationSuggestions && locationSuggestions.length > 0 && (<div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">{locationSuggestions.map((place, index) => (<button key={index} onClick={() => selectLocation(place.display_name)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 truncate">{place.display_name}</button>))}</div>)}
                      </div>
                    )}
                  </div>

                  {/* ✅ UPDATED: Tag People (Select Actual Users) */}
                  <div className="space-y-2">
                    <button onClick={() => setShowUserTagInput(!showUserTagInput)} className="w-full flex items-center justify-between p-4 glass rounded-xl">
                      <div className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> <span>Tag People</span></div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showUserTagInput ? 'rotate-90' : ''}`} />
                    </button>
                    {showUserTagInput && (
                      <div className="space-y-3 bg-secondary/20 p-4 rounded-xl">
                        <div className="relative">
                          <Input value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} placeholder="Search users to tag..." />
                          {isSearchingUsers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
                          {userSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                              {userSuggestions.map(user => (
                                <button key={user._id} onClick={() => toggleTagUser(user)} className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors border-b border-border last:border-0">
                                  <AvatarRing src={user.profilePic} size="sm" />
                                  <div className="text-left"><p className="text-sm font-bold">{user.username}</p><p className="text-xs text-muted-foreground">{user.name}</p></div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {taggedUsers.map(user => (
                            <span key={user._id} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm flex items-center gap-2">
                              @{user.username} <X className="w-3 h-3 cursor-pointer" onClick={() => toggleTagUser(user)} />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HASHTAGS */}
                  <div className="space-y-2">
                    <button onClick={() => setShowTagInput(!showTagInput)} className="w-full flex items-center justify-between p-4 glass rounded-xl">
                      <div className="flex items-center gap-2"><Hash className="w-5 h-5 text-primary" /> <span>Add Hashtags</span></div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showTagInput ? 'rotate-90' : ''}`} />
                    </button>
                    {showTagInput && (
                      <div>
                        <div className="flex gap-2 mb-2"><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="nature" onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} /><Button onClick={handleAddTag} size="sm">Add</Button></div>
                        <div className="flex flex-wrap gap-2">{tags.map(t => (<span key={t} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1">#{t} <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(t)} /></span>))}</div>
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