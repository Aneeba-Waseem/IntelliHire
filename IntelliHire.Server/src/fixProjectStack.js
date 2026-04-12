import sequelize from "./config/db.js";
import Project from "./models/Project.js";

const normalizeOldTechStack = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const projects = await Project.findAll();

    for (let project of projects) {
      let tech = project.tech_stack;

      if (typeof tech === "string") {
        const normalized = tech.split(",").map(t => t.trim());

        project.tech_stack = normalized;
        await project.save();

        console.log(`Updated project ${project.id}`);
      }
    }

    console.log("Migration completed ✅");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

normalizeOldTechStack();