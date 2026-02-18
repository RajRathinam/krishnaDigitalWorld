import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Advertisement = sequelize.define('Advertisement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Path to uploaded video file'
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to video thumbnail image'
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'External link when ad is clicked'
  },
  position: {
    type: DataTypes.ENUM('homepage_top', 'homepage_middle', 'homepage_bottom', 'sidebar', 'popup'),
    defaultValue: 'homepage_middle',
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('video', 'youtube', 'vimeo'),
    defaultValue: 'video',
    allowNull: false
  },
  externalVideoId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'YouTube/Vimeo video ID if type is youtube or vimeo'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher priority = shows first'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxViews: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum number of views before expiry'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  autoplay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  muted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  loop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Video duration in seconds'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  paranoid: true, // Soft delete
  tableName: 'Advertisements'
});

// Instance method to increment views
Advertisement.prototype.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

// Instance method to increment clicks
Advertisement.prototype.incrementClicks = async function() {
  this.clicks += 1;
  await this.save();
};

// Check if ad is expired based on views or dates
Advertisement.prototype.isExpired = function() {
  const now = new Date();
  
  if (this.endDate && new Date(this.endDate) < now) {
    return true;
  }
  
  if (this.maxViews && this.views >= this.maxViews) {
    return true;
  }
  
  return false;
};

export default Advertisement;