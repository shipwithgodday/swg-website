export const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Godday</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eeeeee;
        }
        .logo {
            max-width: 200px;
            height: auto;
        }
        .content {
            padding: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #eeeeee;
            font-size: 12px;
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://joels-pic-bucket.s3.us-east-2.amazonaws.com/logo.png" alt="Godday Logo" class="logo">
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Godday. All rights reserved.</p>
            <p>This email was sent to you because you are registered with Godday.</p>
        </div>
    </div>
</body>
</html>
`;
