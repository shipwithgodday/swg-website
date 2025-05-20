// Generate 150 test email addresses
const generateTestEmails = () => {
  const emails = [];
  for (let i = 1; i <= 150; i++) {
    emails.push({
      Email: `test${i}@example.com`,
    });
  }
  return emails;
};

// Generate and log the emails
const testEmails = generateTestEmails();
console.log(JSON.stringify(testEmails, null, 2));
