import { useState } from "react";
import {
  CONTACT_EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  RESUME_URL,
} from "../config/site";

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: GITHUB_URL,
    description: "Code samples, prototypes, and personal projects",
  },
  {
    label: "LinkedIn",
    href: LINKEDIN_URL,
    description: "Background, experience, and professional contact",
  },
  {
    label: "CV",
    href: RESUME_URL,
    description: "Download my resume as a PDF",
  },
];

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const getMailtoHref = () => {
    const subject = encodeURIComponent(
      `Portfolio - Message from ${formData.name || "visitor"}`
    );
    const body = encodeURIComponent(
      [
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        "",
        "Message:",
        formData.message,
      ].join("\n")
    );

    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = getMailtoHref();
    setSubmitStatus(
      "Your email app should open with a pre-filled draft. If it does not, use the email address shown on the left."
    );
  };

  return (
    <section className="contactWrap" aria-labelledby="contact-title">
      <div className="contactShell">
        <header className="contactHeader">
          <p className="contactEyebrow">Contact</p>
          <h2 id="contact-title">Let's build something together</h2>
          <p>
            Game project, freelance opportunity, or just a quick question: send me
            a message and I will get back to you by email.
          </p>
        </header>

        <div className="contactGrid">
          <aside className="contactCard" aria-label="Contact details">
            <p className="contactCard__label">Email</p>
            <a className="contactEmail" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>

            <div className="contactSocials" aria-label="Social links">
              {SOCIAL_LINKS.map((link) => (
                <a
                  className="contactSocialLink"
                  href={link.href}
                  key={link.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{link.label}</span>
                  <small>{link.description}</small>
                </a>
              ))}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="contactForm">
            <label className="contactField">
              <span>Name</span>
              <input
                autoComplete="name"
                name="name"
                onChange={handleChange}
                placeholder="Your name"
                required
                value={formData.name}
              />
            </label>

            <label className="contactField">
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                type="email"
                value={formData.email}
              />
            </label>

            <label className="contactField">
              <span>Message</span>
              <textarea
                name="message"
                onChange={handleChange}
                placeholder="Tell me about your project, your needs, or what you want to build."
                required
                value={formData.message}
              />
            </label>

            <button className="contactSubmit" type="submit">
              Open email draft
            </button>

            <p className="contactStatus" aria-live="polite">
              {submitStatus}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
