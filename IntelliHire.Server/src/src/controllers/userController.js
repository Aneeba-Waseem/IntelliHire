import User from "../models/User.js"; 
import bcrypt from "bcryptjs";

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] }, // hide password
    });
    console.log("users", users);
    res.json(users); // array return
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching users" });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching user" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { fullName, email, role, password } = req.body;

    let updateData = { fullName, email };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role) {
      updateData.role = role;
    }

    if (req.files?.profilePic) {
      updateData.profilePic = req.files.profilePic[0].path;
    }

    if (req.files?.cv) {
      updateData.cv = req.files.cv[0].path;
    }

    const [updated] = await User.update(updateData, {
      where: { id: req.params.id },
      returning: true,
    });

    if (!updated) return res.status(404).json({ error: "User not found" });

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating user" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting user" });
  }
};
