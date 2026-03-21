import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Users, Crown, UserPlus, UserMinus, ShieldCheck, ShieldMinus, Camera, LogOut, Settings
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/axios";

interface GroupMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: "admin" | "member";
  isOnline?: boolean;
}

interface AddableUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface GroupAdminPanelProps {
  showPanel: boolean;
  onClose: () => void;
  members: GroupMember[];
  isCurrentUserAdmin: boolean;
  groupAvatar: string | null;
  onRemoveMember: (id: string) => void;
  onAddMember: (user: AddableUser) => void;
  onToggleAdmin: (id: string) => void;
  onGroupAvatarChange: (file: File, previewUrl: string) => void;
  onGroupNameChange: (newName: string) => void;
  onLeaveGroup: () => void;
  addableUsers: AddableUser[];
  currentUserId: string;
  groupName?: string;
  initialTab?: "members" | "settings";
}

export default function GroupAdminPanel({
  showPanel,
  onClose,
  members,
  isCurrentUserAdmin,
  groupAvatar,
  onRemoveMember,
  onAddMember,
  onToggleAdmin,
  onGroupAvatarChange,
  onGroupNameChange,
  onLeaveGroup,
  currentUserId,
  groupName,
  initialTab = "members",
}: GroupAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"members" | "settings">(initialTab);
  const [showAddMember, setShowAddMember] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(groupName || "");
  const [addSearch, setAddSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [memberAction, setMemberAction] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync activeTab with initialTab when panel opens
  useState(() => {
    setActiveTab(initialTab);
  });

  const handleSearch = async (query: string) => {
    setAddSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/users/search?username=${query}`);
      const existingIds = members.map(m => m.id);
      const filtered = (data.data || []).filter((u: any) => !existingIds.includes(u._id));
      setSearchResults(filtered);
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      onGroupAvatarChange(file, ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setShowAddMember(false);
    setAddSearch("");
    setSearchResults([]);
    setMemberAction(null);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {showPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] z-[111] bg-background/95 glass-strong flex flex-col border-l border-white/10 shadow-2xl"
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Panel Header */}
            <div className="p-6 border-b border-white/5 bg-card/30">
              <div className="flex items-center justify-between mb-6">
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }} 
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
                <h3 className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground">Group Details</h3>
                <div className="w-9" />
              </div>

              {/* Group avatar with upload */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="relative"
                >
                  <div
                    className="w-28 h-28 rounded-full bg-linear-to-tr from-amber-400 to-emerald-500 p-[3px] shadow-2xl shadow-amber-500/10 cursor-pointer overflow-hidden group/avatar"
                    onClick={() => isCurrentUserAdmin && fileInputRef.current?.click()}
                  >
                    <div className="w-full h-full rounded-full border-4 border-background overflow-hidden relative">
                        {groupAvatar ? (
                        <img src={groupAvatar} className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110" />
                        ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Users className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        )}
                        {isCurrentUserAdmin && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                  </div>
                  {isCurrentUserAdmin && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 p-2.5 bg-background border border-white/10 rounded-full shadow-xl text-primary"
                    >
                      <Camera className="w-4 h-4" />
                    </motion.button>
                  )}
                </motion.div>
                
                <div className="text-center w-full px-4">
                    {isEditingName ? (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                        <Input 
                        value={editNameValue} 
                        onChange={e => setEditNameValue(e.target.value)}
                        className="h-10 text-center font-bold text-lg bg-white/5 border-white/10 focus:border-primary/50"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            onGroupNameChange(editNameValue);
                            setIsEditingName(false);
                            } else if (e.key === 'Escape') {
                            setEditNameValue(groupName || "");
                            setIsEditingName(false);
                            }
                        }}
                        />
                        <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)} className="h-8 text-[10px] font-black uppercase">Cancel</Button>
                            <Button size="sm" variant="gradient" onClick={() => { onGroupNameChange(editNameValue); setIsEditingName(false); }} className="h-8 text-[10px] font-black uppercase">Save Name</Button>
                        </div>
                    </motion.div>
                    ) : (
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 group/title justify-center">
                            <h2 className="font-black text-2xl tracking-tight leading-none truncate max-w-[250px]">
                                {groupName || "Group Name"}
                            </h2>
                            {isCurrentUserAdmin && (
                            <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }} 
                                onClick={() => {
                                    setEditNameValue(groupName || "");
                                    setIsEditingName(true);
                                }}
                                className="opacity-0 group-hover/title:opacity-100 p-1 rounded-md hover:bg-white/5 transition-all text-muted-foreground"
                            >
                                <Settings className="w-4 h-4" />
                            </motion.button>
                            )}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            Group Chat · {members.length} Members
                        </p>
                    </div>
                    )}
                </div>

                {isCurrentUserAdmin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full"
                  >
                    <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Administrator</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-1.5 gap-1.5 bg-white/5 mx-6 mt-6 rounded-2xl border border-white/5">
              <button 
                onClick={() => setActiveTab("members")}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === "members" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-muted-foreground hover:bg-white/5"}`}
              >
                Members
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === "settings" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-muted-foreground hover:bg-white/5"}`}
              >
                Settings
              </button>
            </div>

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Member List ({members.length})
                    </p>
                    {isCurrentUserAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddMember(!showAddMember)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add People</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Add member section - admin only */}
                  <AnimatePresence>
                    {showAddMember && isCurrentUserAdmin && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 overflow-hidden"
                      >
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              variant="glass"
                              placeholder="Search people..."
                              value={addSearch}
                              onChange={(e) => handleSearch(e.target.value)}
                              className="pl-11 h-10 text-sm border-white/5 bg-black/20"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar px-1">
                            {searchResults.map((user) => (
                                <motion.div
                                    key={user._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-white/5 group/res"
                                    onClick={() => {
                                        onAddMember({ id: user._id, name: user.name, username: user.username, avatar: user.profilePic });
                                        setShowAddMember(false);
                                        setAddSearch("");
                                        setSearchResults([]);
                                    }}
                                >
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                                        <img src={user.profilePic || "/image.png"} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white/90 leading-none">{user.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-tighter">@{user.username}</p>
                                    </div>
                                    <div className="p-2 bg-primary/10 group-hover/res:bg-primary text-primary group-hover/res:text-primary-foreground rounded-lg transition-colors">
                                        <UserPlus className="w-3.5 h-3.5" />
                                    </div>
                                </motion.div>
                            ))}
                            {addSearch.length >= 2 && searchResults.length === 0 && (
                                <div className="text-center py-4 opacity-50">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">User Not Found</p>
                                </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Member list */}
                  <div className="space-y-2">
                    {members.map((member, i) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group/member"
                      >
                        <div
                          className={cn(
                              "flex items-center gap-3 p-3 rounded-2xl transition-all border border-transparent",
                              memberAction === member.id ? "bg-white/10 border-white/10" : "hover:bg-white/5"
                          )}
                          onClick={() => {
                            if (isCurrentUserAdmin && member.id !== currentUserId) {
                              setMemberAction(memberAction === member.id ? null : member.id);
                            }
                          }}
                        >
                          <div className="relative shrink-0">
                            {member.id === currentUserId ? (
                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-amber-400 to-amber-600 p-[2px] shadow-lg">
                                    <div className="w-full h-full rounded-full border-2 border-background overflow-hidden">
                                        <img src={member.avatar || "/image.png"} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ) : (
                                <AvatarRing src={member.avatar} size="md" isOnline={member.isOnline} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("text-sm font-bold truncate", member.id === currentUserId ? "text-amber-500" : "text-white/90")}>
                                {member.id === currentUserId ? "You" : member.name}
                              </p>
                              {member.role === "admin" && (
                                <Crown className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-0.5">
                              @{member.username} {member.isOnline && "· ONLINE"}
                            </p>
                          </div>

                          {isCurrentUserAdmin && member.id !== currentUserId && (
                            <motion.div
                              animate={{ rotate: memberAction === member.id ? 90 : 0 }}
                              className="p-2 text-muted-foreground/30 group-hover/member:text-white transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                            </motion.div>
                          )}
                        </div>

                        {/* Admin action buttons */}
                        <AnimatePresence>
                          {memberAction === member.id && isCurrentUserAdmin && member.id !== currentUserId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-white/5 rounded-b-2xl mx-1"
                            >
                              <div className="flex gap-2 p-3 pt-0">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleAdmin(member.id);
                                    setMemberAction(null);
                                  }}
                                  className={cn(
                                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                      member.role === "admin"
                                        ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                                        : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20"
                                  )}
                                >
                                  {member.role === "admin" ? (
                                    <>
                                      <ShieldMinus className="w-3.5 h-3.5" />
                                      Revoke Admin
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      Grant Admin
                                    </>
                                  )}
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveMember(member.id);
                                    setMemberAction(null);
                                  }}
                                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 transition-all"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  Remove
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Group Info</h4>
                    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group/set"
                      >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover/set:text-primary transition-colors">
                                <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold">Group Photo</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Modify</span>
                      </button>
                      <div className="h-px bg-white/5 mx-4" />
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group/set"
                      >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover/set:text-primary transition-colors">
                                <Settings className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold">Group Name</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Rename</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Permissions</h4>
                    <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold">Admin-Only Modification</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Only admins can edit group info</p>
                        </div>
                        <div className="w-10 h-5 bg-amber-500/20 rounded-full flex items-center px-1 border border-amber-500/30">
                            <div className="w-3 h-3 bg-amber-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {/* Leave group */}
            <div className="p-6 border-t border-white/5 bg-card/20">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={onLeaveGroup}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-red-500 border border-red-500/10 transition-all font-black text-xs uppercase tracking-[0.2em]"
              >
                <LogOut className="w-4 h-4" />
                Leave Group
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
