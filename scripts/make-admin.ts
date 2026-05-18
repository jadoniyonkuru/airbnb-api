import prisma from "../src/config/prisma";
import bcrypt from "bcryptjs";

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@local.test";
    const password = process.env.ADMIN_PASSWORD || `AdminPass!${Math.floor(Math.random() * 9000) + 1000}`;
    const username = `admin_${Date.now()}`;

    // connect and ensure DB available
    await prisma.$connect();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
      console.log("Promoted existing user to ADMIN:", email);
      console.log("Password unchanged for existing user.");
      process.exit(0);
    }

    const hashed = bcrypt.hashSync(password, 10);

    const user = await prisma.user.create({
      data: {
        name: "Administrator",
        email,
        username,
        phone: "0000000000",
        role: "ADMIN",
        password: hashed,
      },
    });

    console.log("Created admin user:");
    console.log({ email, password });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
