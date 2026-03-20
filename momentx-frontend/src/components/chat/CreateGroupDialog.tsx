import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Users, Camera, Check, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axios";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: { name: string; avatar?: File | null; members: string[] }) => void;
}

export function CreateGroupDialog({ isOpen, onClose, onCreated }: CreateGroupDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Avatar states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const endpoint = search.trim()
          ? `/users/search?username=${encodeURIComponent(search.trim())}`
          : "/users/all";

        const { data } = await api.get(endpoint);

        let users = [];
        if (data.data && Array.isArray(data.data)) {
          users = data.data;
        } else if (data.message && Array.isArray(data.message)) {
          users = data.message;
        } else if (Array.isArray(data)) {
          users = data;
        }

        setAvailableUsers(users);
      } catch (error) {
        console.error("❌ Failed to fetch users", error);
        setAvailableUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(fetchUsers, search ? 300 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [search, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  const toggleUser = (user: any) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length < 1) return;
    setIsCreating(true);
    try {
      await onCreated({
        name: groupName,
        avatar: selectedFile,
        members: selectedUsers.map((u) => u._id),
      });
      reset();
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSearch("");
    setSelectedUsers([]);
    setGroupName("");
    setSelectedFile(null);
    setPreviewImage(null);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={reset}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg h-[650px] max-h-[90vh] flex flex-col glass-strong rounded-3xl overflow-hidden shadow-2xl border border-border/50"
          >
            {/* Header */}
            <div className="relative p-6 flex items-center justify-between border-b border-border/50">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={step === 2 ? () => setStep(1) : reset}
                className="p-2 glass rounded-full hover:bg-muted transition-colors"
                disabled={isCreating}
              >
                {step === 2 ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </motion.button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-xl font-display font-bold gradient-text">
                  {step === 1 ? "Add Members" : "Group Details"}
                </h2>
              </div>
              <div className="w-9" />

              {/* Step indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
                <motion.div
                  className="h-full bg-gradient-primary"
                  initial={{ width: "50%" }}
                  animate={{ width: step === 1 ? "50%" : "100%" }}
                  transition={{ type: "spring", damping: 20 }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Search */}
                  <div className="p-6 pb-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <Input
                        variant="glass"
                        placeholder="Search people..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-12"
                      />
                      {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                    </div>
                  </div>

                  {/* Selected chips */}
                  <div className="h-14 flex items-center px-6">
                    <AnimatePresence mode="popLayout">
                      {selectedUsers.length > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 w-full"
                        >
                          {selectedUsers.map((user) => (
                            <motion.div
                              key={user._id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              layout
                              className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full shrink-0 border border-primary/20"
                            >
                              <img src={user.profilePic || "/image.png"} className="w-5 h-5 rounded-full object-cover" />
                              <span className="text-xs font-semibold whitespace-nowrap">{user.username}</span>
                              <button
                                onClick={() => toggleUser(user)}
                                className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Select at least one member</p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* User list */}
                  <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-4 scrollbar-hide">
                    {availableUsers.length > 0 ? (
                      availableUsers.map((user, i) => {
                        const selected = selectedUsers.find((u) => u._id === user._id);
                        return (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => toggleUser(user)}
                            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${selected ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" : "hover:bg-muted/40 border-transparent"
                              }`}
                          >
                            <div className="relative">
                              <AvatarRing src={user.profilePic} size="md" />
                              <AnimatePresence>
                                {selected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center ring-2 ring-background shadow-lg"
                                  >
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[15px] truncate">{user.name || user.username}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                        <Users className="w-12 h-12 mb-2" />
                        <p>No users found</p>
                      </div>
                    )}
                  </div>

                  {/* Next button */}
                  <div className="p-6 border-t border-border/50 bg-card/30">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectedUsers.length >= 1 && setStep(2)}
                      disabled={selectedUsers.length < 1}
                      className="w-full py-4 bg-gradient-primary rounded-2xl font-bold text-primary-foreground flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="w-5 h-5" />
                      {selectedUsers.length > 0 && (
                        <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-black">
                          {selectedUsers.length}
                        </span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 flex flex-col p-8 overflow-y-auto scrollbar-hide">
                    {/* Group avatar section */}
                    <div className="flex flex-col items-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="relative group"
                      >
                        <div className="w-28 h-28 rounded-full bg-gradient-primary p-1 shadow-2xl animate-glow">
                          <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-background/50">
                            {previewImage ? (
                              <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <Users className="w-12 h-12 text-primary/50" />
                            )}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-3 bg-gradient-primary rounded-full ring-4 ring-background shadow-xl text-primary-foreground"
                          disabled={isCreating}
                        >
                          <Camera className="w-5 h-5" />
                        </motion.button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </motion.div>
                      <p className="mt-4 text-sm font-medium text-muted-foreground">Upload Group Photo</p>
                    </div>

                    {/* Group Name input */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="w-full space-y-2 mb-8"
                    >
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Group Name</label>
                      <Input
                        variant="glass"
                        placeholder="Enter a fun name..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="h-14 text-center text-lg font-display font-bold border-primary/20 focus:border-primary/50"
                        autoFocus
                        disabled={isCreating}
                      />
                    </motion.div>

                    {/* Members List Preview */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex-1"
                    >
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-4 ml-1">
                        Members · {selectedUsers.length + 1}
                      </p>
                      <div className="space-y-2 pr-1">
                        {/* You (admin) */}
                        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                            <span className="text-xs font-black text-primary-foreground">ME</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">You</p>
                            <p className="text-[10px] uppercase font-black tracking-tighter text-primary/70">Group Organizer</p>
                          </div>
                          <span className="px-2.5 py-1 text-[10px] font-black bg-primary text-primary-foreground rounded-full uppercase tracking-tighter">
                            Admin
                          </span>
                        </div>

                        {selectedUsers.map((user, i) => (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-colors border border-transparent"
                          >
                            <img src={user.profilePic || "/image.png"} className="w-10 h-10 rounded-full object-cover border border-border/50" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{user.name || user.username}</p>
                              <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter italic">Member</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Create button */}
                  <div className="p-6 border-t border-border/50 bg-card/30">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreate}
                      disabled={!groupName.trim() || isCreating}
                      className="w-full py-4 bg-gradient-primary rounded-2xl font-black text-primary-foreground flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-primary/30 neon-glow"
                    >
                      {isCreating ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Create Magic</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}