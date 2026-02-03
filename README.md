## EmailxSender

EmailxSender is a small open-source Next.js app that helps you send personalized job outreach or bulk recruiter emails directly from your own Gmail account using a Gmail App Password.

### Features

- **Bulk sending with per-recipient delivery** (no BCC lists).
- **Local-only credentials** stored in `localStorage` on your device.
- **Auto-saved drafts** for subject, body, recipients, and resume.
- **Send history** per Gmail so you can see who you’ve already contacted.
- **Dark/light theme** and a simple, focused UI.

### Getting started

1. Install dependencies:

```bash
pnpm install
```

2. Run the development server:

```bash
pnpm dev
```

3. Open `http://localhost:3000` in your browser.

4. On the login screen:
   - Enter your Gmail address.
   - Enter a **Gmail App Password** (16 characters), not your normal password.

5. Compose your email, upload a PDF resume, add recipients, and send. You can view past sends on the **History** page.

### Security notes

- Your Gmail and App Password are stored only in your browser’s `localStorage` and are never sent to any external backend other than Gmail’s SMTP through the server-side email API.
- You should generate a dedicated App Password for this tool and revoke it from your Google Account if you stop using the app.

### Contributing

Contributions and feedback are welcome. Feel free to open issues or pull requests to improve the code quality, UX, or documentation.

### License

This project is available under the MIT License. See `LICENSE` (if present) or add one before distributing.
