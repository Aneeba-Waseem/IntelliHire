import sequelize from "./db.js";
import DomainsList from "../models/DomainsList.js";
import TechStacksList from "../models/TechStacksList.js";

const seedData = async () => {
    try {
        await sequelize.sync(); // ensure tables exist

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
                { name: "Docker" },
                { name: "Kubernetes" },
                { name: "SQL / MySQL / PostgreSQL" },
                { name: "MongoDB / NoSQL" },
                { name: "Redis / Memcached" },
                { name: "Git / GitHub / GitLab" },
                { name: "Jenkins / CI-CD" },
                { name: "TensorFlow / PyTorch" },
                { name: "Flutter" },
                { name: "React Native" },
            ],
            { ignoreDuplicates: true }
        );

        console.log("✅ DomainsList and TechStacksList data inserted successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error inserting seed data:", error);
        process.exit(1);
    }
};

seedData();
