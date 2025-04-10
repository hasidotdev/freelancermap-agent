import { Project } from "./types"
import nodemailer from "nodemailer"

// Ensure you have these environment variables set:
// GMAIL_USER: The Gmail address the refresh token is for (e.g., your.email@gmail.com)
// GMAIL_OAUTH_CLIENT_ID: Your Google Cloud OAuth 2.0 Client ID
// GMAIL_OAUTH_CLIENT_SECRET: Your Google Cloud OAuth 2.0 Client Secret
// GMAIL_OAUTH_REFRESH_TOKEN: The Refresh Token obtained via OAuth 2.0 flow
// RECIPIENT_EMAIL: The email address to send notifications to

export class Notifier {
  private transporter: nodemailer.Transporter

  constructor() {
    // Validate environment variables for OAuth2
    if (
      !process.env.GMAIL_USER ||
      !process.env.GMAIL_OAUTH_CLIENT_ID ||
      !process.env.GMAIL_OAUTH_CLIENT_SECRET ||
      !process.env.GMAIL_OAUTH_REFRESH_TOKEN ||
      !process.env.RECIPIENT_EMAIL
    ) {
      throw new Error(
        "Missing required environment variables for Gmail OAuth2: " +
          "GMAIL_USER, GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, " +
          "GMAIL_OAUTH_REFRESH_TOKEN, RECIPIENT_EMAIL"
      )
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
        clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
        // access token will be generated automatically by nodemailer if not provided
      },
    })
    console.log("Notifier: Mail transporter configured using OAuth2.")
  }

  public async notify(projects: Project[]): Promise<void> {
    if (projects.length === 0) {
      console.log("Notifier: No new projects to notify about.")
      return
    }

    console.log(`Notifier: Received ${projects.length} new projects. Preparing email...`)

    const subject = `Freelancermap: ${projects.length} New Project(s) Found!`
    const projectListHtml = projects
      .map(
        (project) => `
        <li>
          <strong>${project.title}</strong> (ID: ${project.id})<br>
          Created: ${new Date(project.created).toLocaleString()}<br>
          Company: ${project.company}<br>
          Location: ${project.city}<br>
          Link: <a href="https://www.freelancermap.de/projekt/${project.slug}">https://www.freelancermap.de/projekt/${project.slug}</a>
          <br><br>
          <pre style="white-space: pre-wrap; word-wrap: break-word;">${project.description.substring(0, 500)}${
          project.description.length > 500 ? "..." : ""
        }</pre>
        </li>
      `
      )
      .join("")

    const htmlBody = `
      <h1>New Freelancermap Projects Found</h1>
      <p>Found ${projects.length} new project(s) matching your criteria:</p>
      <ul>
        ${projectListHtml}
      </ul>
    `

    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender address (your Gmail)
      to: process.env.RECIPIENT_EMAIL, // List of receivers
      subject: subject,
      html: htmlBody,
    }

    try {
      console.log("Notifier: Sending email via OAuth2...")
      // Nodemailer will automatically handle fetching/refreshing the access token
      const info = await this.transporter.sendMail(mailOptions)
      console.log("Notifier: Email sent successfully! Message ID:", info.messageId)
    } catch (error) {
      console.error("Notifier: Error sending email:", error)
      // Depending on requirements, you might want to implement retries or other error handling
    }
  }

  testMail = async () => {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: "Test Email",
      text: "This is a test email from the Notifier class.",
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log("Notifier: Test email sent successfully! Message ID:", info.messageId)
    } catch (error) {
      console.error("Notifier: Error sending test email:", error)
    }
  }
}
