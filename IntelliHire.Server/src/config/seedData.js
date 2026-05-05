import DomainsList from "../models/DomainsList.js";
import TechStacksList from "../models/TechStacksList.js";

const seedData = async () => {
  try {
    console.log("🌱 Seeding started...");

    // Check if already seeded
    const domainCount = await DomainsList.count();
    const techCount = await TechStacksList.count();

    if (domainCount === 0) {
      await DomainsList.bulkCreate(
        [
          { name: "Data Structures and Algorithms" },
          { name: "Database" },
          { name: "Deep Learning" },
          { name: "Computer Vision" },
          { name: "Object Oriented Programming" },
          { name: "System Design" },
          { name: "Software Engineering" },
          { name: "Computer Networks" },
          { name: "Web Development" },
          { name: "AI / Machine Learning" },
          { name: "Generative AI" },
          { name: "Cloud Computing" },
          { name: "Cybersecurity" },
          { name: "Data Science" },
          { name: "Mobile Development" },
          { name: "DevOps" },
          { name: "Embedded Systems / IoT" },
          { name: "Database / Big Data" },
          { name: "Game Development" },
          { name: "UI/UX Design" },
          { name: "QA / Testing / Automation" }
        ],
        { ignoreDuplicates: true }
      );

      console.log("✅ Domains seeded");
    } else {
      console.log("⚠️ Domains already exist, skipping...");
    }

    if (techCount === 0) {
      await TechStacksList.bulkCreate(
        [
          { name: "React" },
          { name: "Angular" },
          { name: "Vue.js" },
          { name: "Node.js" },
          { name: "Express.js" },
          { name: "Python" },
          { name: "Django" },
          { name: "Flask" },
          { name: "Java" },
          { name: "Spring Boot" },
          { name: "C++" },
          { name: "C#" },
          { name: "Asp.net" },
          { name: ".net Framework" },
          { name: "Go" },
          { name: "Rust" },
          { name: "AWS" },
          { name: "Azure" },
          { name: "GCP" },
          { name: "Docker" },
          { name: "Kubernetes" },
          { name: "Helm" },
          { name: "Terraform" },
          { name: "SQL / MySQL / PostgreSQL" },
          { name: "MongoDB / NoSQL" },
          { name: "Redis / Memcached" },
          { name: "Git / GitHub / GitLab" },
          { name: "Jenkins / CI-CD" },
          { name: "TensorFlow / PyTorch" },
          { name: "Flutter" },
          { name: "Ruby on Rails" },
          { name: "React Native" }
        ],
        { ignoreDuplicates: true }
      );

      console.log("✅ Tech stacks seeded");
    } else {
      console.log("⚠️ Tech stacks already exist, skipping...");
    }

    console.log("🌱 Seeding finished");

  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

export default seedData;
