import mailgun from "mailgun-js";

export const sendMail = async (
  sender_email,
  recivers_email,
  email_title,
  email_message
) => {
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });

  const data = {
    // from: "Excited User <me@samples.mailgun.org>",
    // to: "bar@example.com, YOU@YOUR_DOMAIN_NAME",
    // subject: "Hello",
    // text: "Testing some Mailgun awesomness!",
    from: sender_email,
    to: recivers_email,
    subject: email_title,
    text: email_message,
  };
  mg.messages().send(data, function (error, body) {
    console.log(body);
  });
};
