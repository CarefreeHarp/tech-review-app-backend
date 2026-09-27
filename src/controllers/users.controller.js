import { User } from "../models/User.js";

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "No encontramos este usuario." });
    }

    return res.json(user);
  } catch (error) {
    console.log("Error getting user:", error);
    return res
      .status(500)
      .json({ message: "No pudimos cargar el usuario. Intenta de nuevo más tarde." });
  }
};
