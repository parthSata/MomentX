import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Users, Crown, UserPlus, UserMinus, Shield,
  LogOut, Settings, ShieldCheck, ShieldMinus, Camera
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
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

  return (
    <AnimatePresence>
      {showPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm z-50 glass-strong flex flex-col"
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
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center justify-between mb-4">
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleClose}>
                  <X className="w-5 h-5" />
                </motion.button>
                <h3 className="font-display font-bold gradient-text">Group Info</h3>
                <div className="w-5" />
              </div>

              {/* Group avatar with upload */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="relative mb-3"
                >
                  <div
                    className="w-24 h-24 rounded-full bg-gradient-primary p-[3px] animate-glow cursor-pointer overflow-hidden"
                    onClick={() => isCurrentUserAdmin && fileInputRef.current?.click()}
                  >
                    {groupAvatar ? (
                      <img src={groupAvatar} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                        <Users className="w-10 h-10 text-primary" />
                      </div>
                    )}
                  </div>
                  {isCurrentUserAdmin && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2.5 bg-gradient-primary rounded-full ring-3 ring-background shadow-lg"
                    >
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </motion.button>
                  )}
                </motion.div>
                
                {isEditingName ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      value={editNameValue} 
                      onChange={e => setEditNameValue(e.target.value)}
                      className="h-8 text-sm"
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
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onGroupNameChange(editNameValue);
                        setIsEditingName(false);
                      }}
                      className="p-1.5 glass rounded-md bg-primary text-primary-foreground"
                    >
                      <Crown className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <h2 className="font-display font-bold text-lg">{groupName || members[0]?.name || "Group Settings"}</h2>
                    {isCurrentUserAdmin && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        setEditNameValue(groupName || "");
                        setIsEditingName(false);
                        setIsEditingName(!isEditingName);
                      }}>
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-0.5">Group · {members.length} members</p>

                {/* Admin badge */}
                {isCurrentUserAdmin && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mt-3 flex items-center justify-center gap-2 px-6 py-2 bg-primary/10 rounded-full ring-1 ring-primary/20 w-fit"
                  >
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">You are Admin</span>
                  </motion.div>
                )}              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-2 gap-1 bg-muted/30 mx-4 mt-2 rounded-xl">
              <button 
                onClick={() => setActiveTab("members")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "members" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-primary/5"}`}
              >
                Members
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "settings" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-primary/5"}`}
              >
                Settings
              </button>
            </div>

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Members · {members.length}
                    </p>
                    {isCurrentUserAdmin && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAddMember(!showAddMember)}
                        className="p-1.5 glass rounded-full"
                      >
                        <UserPlus className="w-4 h-4 text-primary" />
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
                        className="mb-3 overflow-hidden"
                      >
                        <div className="p-3 glass rounded-2xl space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              variant="glass"
                              placeholder="Search to add..."
                              value={addSearch}
                              onChange={(e) => handleSearch(e.target.value)}
                              className="pl-9 h-9 text-sm"
                              autoFocus
                            />
                          </div>
                          {searchResults.map((user) => (
                            <motion.div
                              key={user._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-2 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-colors"
                              onClick={() => {
                                onAddMember({ id: user._id, name: user.name, username: user.username, avatar: user.profilePic });
                                setShowAddMember(false);
                                setAddSearch("");
                                setSearchResults([]);
                              }}
                            >
                              <img src={user.profilePic || "/default-avatar.png"} className="w-8 h-8 rounded-full object-cover" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                              </div>
                              <div className="p-1 bg-gradient-primary rounded-full">
                                <UserPlus className="w-3 h-3 text-primary-foreground" />
                              </div>
                            </motion.div>
                          ))}
                          {addSearch.length >= 2 && searchResults.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">No users found</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Member list */}
                  <div className="space-y-1">
                    {members.map((member, i) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="relative"
                      >
                        <div
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => {
                            if (isCurrentUserAdmin && member.id !== currentUserId) {
                              setMemberAction(memberAction === member.id ? null : member.id);
                            }
                          }}
                        >
                          {member.id === currentUserId ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary-foreground">You</span>
                            </div>
                          ) : (
                            <div className="relative shrink-0">
                              <AvatarRing src={member.avatar} size="sm" isOnline={member.isOnline} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold truncate">{member.id === currentUserId ? "You" : member.name}</p>
                              {member.role === "admin" && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/15 rounded-full shrink-0"
                                >
                                  <Crown className="w-3 h-3 text-primary fill-primary" />
                                  <span className="text-[8px] font-bold text-primary uppercase tracking-wider">Admin</span>
                                </motion.div>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {member.id === currentUserId ? "@you" : `@${member.username}`}
                              {member.isOnline && member.id !== currentUserId && (
                                <span className="ml-1 text-green-500">● Online</span>
                              )}
                            </p>
                          </div>

                          {/* Admin indicator for non-me members */}
                          {isCurrentUserAdmin && member.id !== currentUserId && (
                            <motion.div
                              animate={{ rotate: memberAction === member.id ? 90 : 0 }}
                              className="p-1.5 glass rounded-full shrink-0"
                            >
                              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                            </motion.div>
                          )}
                        </div>

                        {/* Admin action buttons for selected member */}
                        <AnimatePresence>
                          {memberAction === member.id && isCurrentUserAdmin && member.id !== currentUserId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex gap-2 px-3 pb-2 pt-1">
                                {/* Toggle admin */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleAdmin(member.id);
                                    setMemberAction(null);
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                                    member.role === "admin"
                                      ? "bg-accent text-accent-foreground hover:bg-accent/80"
                                      : "bg-primary/10 text-primary hover:bg-primary/20"
                                  }`}
                                >
                                  {member.role === "admin" ? (
                                    <>
                                      <ShieldMinus className="w-3.5 h-3.5" />
                                      Remove Admin
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      Make Admin
                                    </>
                                  )}
                                </motion.button>

                                {/* Remove member */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveMember(member.id);
                                    setMemberAction(null);
                                  }}
                                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
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
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Group Identity</h4>
                    <div className="glass-strong p-4 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Group Photo</span>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Change
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Group Name</span>
                        <button 
                          onClick={() => setIsEditingName(true)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Permissions</h4>
                    <div className="glass-strong p-4 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Only Admins can Edit</p>
                          <p className="text-[10px] text-muted-foreground">Restrict name/avatar changes</p>
                        </div>
                        <div className="w-8 h-4 bg-primary/20 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leave group */}
            <div className="p-4 border-t border-border/50">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onLeaveGroup}
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                Leave Group
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}