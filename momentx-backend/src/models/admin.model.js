const adminSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: {
      type: String,
      enum: ["moderator", "superadmin"],
      default: "moderator"
    }
  }, { timestamps: true });
  
  export default mongoose.model("Admin", adminSchema);
  