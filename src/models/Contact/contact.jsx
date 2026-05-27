import React from "react";
import "./contact.css";

function Contact() {
  return (
    <div className="contact-page">
      <h2 className="contact-title">Contact Us</h2>

      <div className="contact-card">
        {/* Contact Info */}
        <div className="contact-info">
          <p>📍 our Shop Address</p>
          <p>📞 9876543210</p>
          <p>📧 blossombake@email.com</p>
        </div>

        {/* Contact Form */}
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" rows="5" required></textarea>

          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
