import { RefreshToken, IRefreshToken } from '../models/RefreshToken';
import mongoose from 'mongoose';

export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<IRefreshToken>;
  findByToken(token: string): Promise<IRefreshToken | null>;
  revokeToken(token: string): Promise<IRefreshToken | null>;
  revokeAllUserTokens(userId: string): Promise<any>;
}

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(userId: string, token: string, expiresAt: Date): Promise<IRefreshToken> {
    const refreshToken = new RefreshToken({
      userId: new mongoose.Types.ObjectId(userId),
      token,
      expiresAt,
    });
    return refreshToken.save();
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token }).populate('userId');
  }

  async revokeToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOneAndUpdate({ token }, { isRevoked: true }, { new: true });
  }

  async revokeAllUserTokens(userId: string): Promise<any> {
    return RefreshToken.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRevoked: false },
      { isRevoked: true }
    );
  }
}
