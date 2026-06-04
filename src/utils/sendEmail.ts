import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",

      text: `Your OTP is ${otp}. It is valid for a limited time.`,

      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        
        <h2 style="color: #333;">Your OTP Code</h2>
        
        <p style="font-size: 14px; color: #555;">
            Use this code to verify your account:
        </p>

        <div style="
            display: inline-block;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            background: #007bff;
            color: #fff;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 15px 0;
        ">
            ${otp}
        </div>

        <p style="font-size: 12px; color: #888;">
            This OTP is valid for a few minutes. Do not share it.
        </p>

        </div>
        `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("OTP email sent:", info.response);

  } catch (error: any) {
    console.error("Error sending OTP email:", error.message);
    throw new Error("Failed to send OTP email");
  }
};