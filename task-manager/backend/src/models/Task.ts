import mongoose, { Document, Schema } from "mongoose";

export interface ITask extends Document {
  title: string;
  status: "todo" | "in-progress" | "done";
  assignedTo: mongoose.Types.ObjectId;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Performance optimization: Add compound index for common queries
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ status: 1 });

export default mongoose.model<ITask>("Task", TaskSchema);
