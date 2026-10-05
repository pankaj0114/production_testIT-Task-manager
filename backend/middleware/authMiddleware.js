import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('=================================');
    console.log('AUTH HEADER:', authHeader);
    console.log('JWT SECRET EXISTS:', !!process.env.JWT_SECRET);
    console.log('=================================');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No Authorization header provided',
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        message: 'No token provided',
      });
    }

    console.log('TOKEN LENGTH:', token.length);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('✅ JWT VERIFIED');
    console.log('DECODED TOKEN:', decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.error('❌ JWT ERROR:', error.name);
    console.error('❌ JWT MESSAGE:', error.message);

    return res.status(401).json({
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

export default authMiddleware;
