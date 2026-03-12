import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Users, Camera, Check, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axios";

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: { name: string; avatar?: string; members: string[] }) => void;
}

export function CreateGroupDialog({ isOpen, onClose, onCreated }: CreateGroupDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]); 
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

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

  const toggleUser = (user: any) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedUsers.length < 1) return;
    onCreated({
      name: groupName,
      members: selectedUsers.map((u) => u._id),
    });
    reset();
  };

  const reset = () => {
    setStep(1);
    setSearch("");
    setSelectedUsers([]);
    setGroupName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={reset}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.9 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-8 z-50 flex flex-col glass-strong rounded-t-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-4 flex items-center justify-between border-b border-border/50">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={step === 2 ? () => setStep(1) : reset}
                className="p-2 glass rounded-full"
              >
                {step === 2 ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </motion.button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold gradient-text">
                  {step === 1 ? "Add Members" : "Group Details"}
                </h2>
              </div>
              <div className="w-9" />
              {/* Step indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
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
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Search */}
                  <div className="p-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        variant="glass"
                        placeholder="Search people..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11"
                      />
                      {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                    </div>
                  </div>

                  {/* Selected chips */}
                  <AnimatePresence>
                    {selectedUsers.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-3"
                      >
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                          {selectedUsers.map((user) => (
                            <motion.div
                              key={user._id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              layout
                              className="flex items-center gap-1.5 px-2 py-1 glass rounded-full shrink-0"
                            >
                              <img src={user.profilePic || "/default-avatar.png"} className="w-5 h-5 rounded-full object-cover" />
                              <span className="text-xs font-medium whitespace-nowrap">{user.username}</span>
                              <button
                                onClick={() => toggleUser(user)}
                                className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User list */}
                  <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
                    {availableUsers.map((user, i) => {
                      const selected = selectedUsers.find((u) => u._id === user._id);
                      return (
                        <motion.div
                          key={user._id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => toggleUser(user)}
                          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                            selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
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
                                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center ring-2 ring-background"
                                >
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  <div className="p-4 border-t border-border/50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectedUsers.length >= 1 && setStep(2)}
                      disabled={selectedUsers.length < 1}
                      className="w-full py-3.5 bg-gradient-primary rounded-2xl font-semibold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed neon-glow"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                      {selectedUsers.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-primary-foreground/20 rounded-full text-xs">
                          {selectedUsers.length} selected
                        </span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Group avatar & name */}
                  <div className="flex-1 flex flex-col items-center pt-8 px-6">
                    {/* Group avatar */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="relative mb-6"
                    >
                      <div className="w-24 h-24 rounded-full bg-gradient-primary p-[3px] animate-glow">
                        <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="absolute -bottom-1 -right-1 p-2 bg-gradient-primary rounded-full ring-3 ring-background"
                      >
                        <Camera className="w-4 h-4 text-primary-foreground" />
                      </motion.button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="w-full max-w-sm"
                    >
                      <Input
                        variant="glass"
                        placeholder="Group name..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="text-center text-lg font-display"
                        autoFocus
                      />
                    </motion.div>

                    {/* Members preview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="mt-8 w-full max-w-sm"
                    >
                      <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">
                        Members · {selectedUsers.length + 1}
                      </p>
                      <div className="space-y-1">
                        {/* You (admin) */}
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 ring-1 ring-primary/20">
                          <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-foreground">You</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">You</p>
                            <p className="text-[10px] text-muted-foreground">Group Admin</p>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-primary text-primary-foreground rounded-full uppercase tracking-wider">
                            Admin
                          </span>
                        </div>
                        {selectedUsers.map((user, i) => {
                          return (
                            <motion.div
                              key={user._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + i * 0.05 }}
                              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
                            >
                              <img src={user.profilePic || "/default-avatar.png"} className="w-9 h-9 rounded-full object-cover" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground">Member</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* Create button */}
                  <div className="p-4 border-t border-border/50">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreate}
                      disabled={!groupName.trim()}
                      className="w-full py-3.5 bg-gradient-primary rounded-2xl font-semibold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed neon-glow"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Create Group</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}