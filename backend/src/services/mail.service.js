import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendCompanyApprovalMail = async (
  to,
  companyName
) => {
  await transporter.sendMail({
    from: `"Career Platform" <${process.env.MAIL_USER}>`,
    to,
    subject: "Company profile approved",
    html: `
      <h3>Congratulations!</h3>
      <p>Your company <b>${companyName}</b> has been approved.</p>
      <p>You can now post jobs as a recruiter.</p>
    `
  });
};

export const sendCompanyRejectedMail = async (
  to,
  reasons
) => {
  await transporter.sendMail({
    from: `"Career Platform" <${process.env.MAIL_USER}>`,
    to,
    subject: "Company profile rejected",
    html: `
      <h3>Company profile rejected</h3>
      <p>Reasons:</p>
      <ul>
        ${reasons.map(r => `<li>${r}</li>`).join("")}
      </ul>
      <p>Please update your information and try again.</p>
    `
  });
};
