import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    req.user = { id: payload.sub };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
    next(error);
  }
}
