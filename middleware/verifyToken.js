const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  // Retrieve the token from the request headers or query parameters
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Attach the decoded payload to the request object for further use
    req.user = decoded;

    // Send a response with the decoded token payload
    // res.status(200).json({ message: "Token validated successfully", decoded });

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = validateToken;
