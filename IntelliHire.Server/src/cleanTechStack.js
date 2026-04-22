import sequelize from "./config/db.js";
import Project from "./models/Project.js";

function cleanTechStack(value) {
  if (!value) return [];

  let arr = value;

  try {
    // Step 1: unwrap until we get usable structure
    while (typeof arr === "string") {
      arr = JSON.parse(arr);
    }

    // Step 2: if still array but first element is messy string
    if (Array.isArray(arr)) {
      arr = arr.flatMap(item => {
        if (typeof item !== "string") return [];

        return item
          .replace(/\[\[/g, "")   // remove [[
          .replace(/\]\]/g, "")   // remove ]]
          .split(",")             // split by comma
          .map(s => s.replace(/"/g, "").trim())
          .filter(Boolean);
      });
    }

    // remove duplicates just in case
    return [...new Set(arr)];
  } catch (err) {
    console.log("Fallback cleanup for:", value);

    return String(value)
      .replace(/\[\[/g, "")
      .replace(/\]\]/g, "")
      .split(",")
      .map(s => s.replace(/"/g, "").trim())
      .filter(Boolean);
  }
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB Connected");

    const projects = await Project.findAll();

    for (let project of projects) {
      const cleaned = cleanTechStack(project.tech_stack);

      await project.update({
        tech_stack: cleaned,
      });

      console.log(`Fixed Project ID: ${project.id}`);
    }

    console.log("DONE CLEANING ✅");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();