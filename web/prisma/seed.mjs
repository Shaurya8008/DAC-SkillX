import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertProfile({ fullName, email, password, role, skills, bio, githubHandle, batch }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.profile.upsert({
    where: { email },
    update: {},
    create: {
      authUserId: email,
      fullName,
      email,
      passwordHash,
      role,
      skills: JSON.stringify(skills),
      bio,
      githubHandle,
      batch,
    },
  });
}

async function main() {
  const admin = await upsertProfile({
    fullName: "DAC Admin",
    email: "admin@dgu.ac.in",
    password: "admin123",
    role: "admin",
    skills: [],
    bio: "DAC Executive Board account.",
  });

  const alice = await upsertProfile({
    fullName: "Alice Sharma",
    email: "alice@dgu.ac.in",
    password: "password123",
    role: "student",
    skills: ["Python", "PyTorch", "Machine Learning"],
    bio: "CS undergrad focused on applied ML, has shipped 3 PyTorch research repos.",
    githubHandle: "alicesharma",
    batch: "2026-CS",
  });

  const bob = await upsertProfile({
    fullName: "Bob Verma",
    email: "bob@dgu.ac.in",
    password: "password123",
    role: "student",
    skills: ["Next.js", "TypeScript", "React"],
    bio: "Full-stack developer, built several Next.js production apps.",
    githubHandle: "bobverma",
    batch: "2026-CS",
  });

  const opportunity = await prisma.opportunity.upsert({
    where: { id: "seed-opportunity-hackathon" },
    update: {},
    create: {
      id: "seed-opportunity-hackathon",
      title: "Smart Campus Hackathon — ML + Web Track",
      description:
        "Looking for a PyTorch + Next.js full-stack pairing to build a smart campus attendance system for the DGU hackathon finals.",
      opportunityType: "hackathon",
      requiredSkills: JSON.stringify(["PyTorch", "Next.js", "Python"]),
      createdById: admin.id,
    },
  });

  console.log("Seeded:", { admin: admin.email, alice: alice.email, bob: bob.email, opportunity: opportunity.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
