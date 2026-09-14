import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OfflineGiftClaim = sequelize.define('OfflineGiftClaim', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  giftId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false
  }
}, {
  tableName: 'offline_gift_claims',
  timestamps: true
});

export default OfflineGiftClaim;
