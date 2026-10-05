import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  //console.log('Auth header received:', authHeader); // Debug log

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: 'No Authorization header provided' });
  }

  const token = authHeader.split(' ')[1]; // Expect "Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: 'Token missing after Bearer' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ message: 'Token invalid or expired' });
    }

    // Attach decoded user payload to request
    req.user = user;
    //console.log('Decoded JWT payload:', user); // Debug log

    next();
  });
};
