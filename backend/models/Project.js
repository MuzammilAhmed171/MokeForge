import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  type: {
    type: String,
    default: 'Website',
  },
  canvas: {
    w: { type: Number, default: 1600 },
    h: { type: Number, default: 1000 }
  },
  assets: [mongoose.Schema.Types.Mixed],
  devices: [mongoose.Schema.Types.Mixed],
  background: mongoose.Schema.Types.Mixed,
  text: mongoose.Schema.Types.Mixed,
  logo: mongoose.Schema.Types.Mixed,
  decoration: mongoose.Schema.Types.Mixed,
  accents: mongoose.Schema.Types.Mixed,
  thumbnail: String,
  exportCount: {
    type: Number,
    default: 0
  },
  decos: [mongoose.Schema.Types.Mixed],
  mood: String,
  icons: [mongoose.Schema.Types.Mixed],
  textboxes: [mongoose.Schema.Types.Mixed],
  canvasImages: [mongoose.Schema.Types.Mixed],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
projectSchema.index({ user: 1, updatedAt: -1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
