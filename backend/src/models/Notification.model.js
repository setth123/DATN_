import mongoose from 'mongoose';
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'fromModel',
    },
    fromModel: {
      type: String,
      required: true,
      enum: ['Candidate', 'User'],
    },
    type: {
      type: String,
      required: true,
      enum: ['NEW_APPLICATION', 'NEW_MESSAGE'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // New fields for display purposes and context
    displayName: { // Stores the name to be displayed (candidate name or sender email part)
      type: String,
      required: true,
    },
    jobTitle: { // For NEW_APPLICATION type
      type: String,
      required: function() { return this.type === 'NEW_APPLICATION'; }, // Required only for NEW_APPLICATION
    },
    conversationId: { // For NEW_MESSAGE type
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: function() { return this.type === 'NEW_MESSAGE'; }, // Required only for NEW_MESSAGE
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
