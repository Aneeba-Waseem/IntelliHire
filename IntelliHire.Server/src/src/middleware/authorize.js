export const authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role) {  console.log(req.user.role);  return res.status(403).json({ error: "Forbidden" }); }
    next();
  };
};
