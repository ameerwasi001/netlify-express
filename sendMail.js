const nodemailer = require("nodemailer");

module.exports = {

    resetPasswordMessage: (resetToken) => {
      return (
            `<html>
                <body>
                    <p>Please enter following code in your app to reset your password.</p>
                    <p>${resetToken}</p>
                </body>
            </html>`
      )
  },

    sendEmail: async (email, subject, text) => {
        try {
          const transporter = nodemailer.createTransport({
            service: process.env.SERVICE,
            auth: {
              user: process.env.GMAILUSER,
              pass: process.env.GMAILPASS,
            },
          });
      
          await transporter.sendMail({
            from: process.env.GMAILUSER,
            to: email,
            subject: subject,
            html: text,
          });
          console.log("email sent sucessfully");
          return true
        } catch (error) {
          console.log("email not sent");
          console.log(error);
          return false
        }
    }
};