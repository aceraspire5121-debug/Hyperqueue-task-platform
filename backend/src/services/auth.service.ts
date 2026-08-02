import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { config } from '../config';
import { AppError } from '../utils/appError';
import { UserRole } from '../models/User';
import { redisClient } from '../config/redis';

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();

export class AuthService {
  async register(userData: { email: string; password: string; name: string; role?: UserRole }) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async login(credentials: { email: string; password: string }) {
    const user = await userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshToken(token: string) {
    const storedToken = await refreshTokenRepository.findByToken(token);

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401); //jab admin kisi user ka token mark karde revoked tab chalgea ye
      //barna to jab bhi accessToken expire hoga tab refreshToken request jayegi aur naya pair generate hokar bapas chala jayega aur
      //yahi rotation chalta rahega to accessToken expire dubara hoga dubara same process repeat with newRefreshToken, ye line tabhi execute
      //hogi jab 7 din ho gye aur token revoke nhi hua, admin ne khudse token ko revoke mark kar dia aur ab request yaha aayi refresh hone ke liye
      //isse agar kabhi kisi hacker ne purana token use karne ki kosis kari to turant ye throw chal jayegi jisse app.ts me interceptor
      //ki response bale block me else execute ho jayega aur localstorage se token remove hote hi user ko login page par bhej dia jayega
      //so its a security feature, barna to har 15 minute me ham token revoke kar rahe hai aur naya pair generate kar hi rahe hai,normally
      //ye kabhi chalega hi nhi
    }

    // Revoke current refresh token (Token Rotation)
    await refreshTokenRepository.revokeToken(token);

    const user = storedToken.userId as any;

    // Generate new token pair
    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role
    );

    return tokens;
  }

  async logout(userId: string, accessToken?: string, refreshTokenStr?: string) {
    if (refreshTokenStr) {
      await refreshTokenRepository.revokeToken(refreshTokenStr);
    }

    if (accessToken) {
      // Blacklist Access Token in Redis for remaining lifetime (15 mins = 900s)
      await redisClient.set(`blacklist:${accessToken}`, 'revoked', 'EX', 900);
    }

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const accessToken = jwt.sign(
      { userId, email, role },
      config.jwt.accessSecret as jwt.Secret,
      { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      { userId, email, role },
      config.jwt.refreshSecret as jwt.Secret,
      { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await refreshTokenRepository.create(userId, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }
}
