import User from "../models/User.js";

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.UserId; // assuming auth middleware sets req.user

    const { fullName, company, companyURL, jobRole, phone } = req.body;

    const user = await User.findOne({ where: { UserId: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // update fields
    user.fullName = fullName || user.fullName;
    user.company = company || user.company;
    user.CompanyURL = companyURL || user.CompanyURL;
    user.jobRole = jobRole || user.jobRole;
    user.phone = phone || user.phone;

    // image (if using multer)
    if (req.file) {
      user.profileImage = req.file ? req.file.filename : user.profileImage;
    }
    console.log("profile ka path ",user.profileImage);
    console.log("profile ka path ",req.file);
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.UserId;

    const user = await User.findOne({
      where: { UserId: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};