import nodemailer from "nodemailer";

export async function sendSOSNotification({ lat, lon }) {
  if (!lat || !lon) {
    throw new Error("Missing lat/lon for SOS");
  }

  console.log("📨 Preparing SOS email...");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SOS_EMAIL_USER,
      pass: process.env.SOS_EMAIL_PASS,
    },
  });

  const googleMapsLink = `https://www.google.com/maps?q=${lat},${lon}`;

  const mailOptions = {
    from: process.env.SOS_EMAIL_USER,
    to: process.env.SOS_EMAIL_TO,
    subject: "🚨 Emergency SOS Alert",
    text: `An emergency SOS signal was triggered.\n\nLocation:\nLatitude: ${lat}\nLongitude: ${lon}\n\nGoogle Maps: ${googleMapsLink}\n\nPlease respond immediately.`,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("✅ SOS email sent:", info.messageId);
  return info;
}
