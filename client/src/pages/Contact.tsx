import React, { useState } from "react";

interface ContactFormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

 export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending form
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Form submitted:", formData);
    setIsSubmitting(false);
    setSuccess(true);
    setFormData({ fullName: "", email: "", subject: "", message: "" });
  };

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left info */}
        <div>
          <p className="text-orange-600 font-semibold mb-2">Get In Touch</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Let's Start a <span className="text-orange-600">Conversation</span>
          </h2>
          <p className="text-gray-700 mb-8">
            Ready to bring your ideas to life? Contact us today to discuss how we can help blend tradition with technology for your next project.
          </p>

          <div className="space-y-6 text-gray-800">
            <div>
              <h3 className="font-semibold mb-1">Our Location</h3>
              <p>
                MaxBrain Technologies Pvt. Ltd.<br />
                SF-77 Jaipur Electronics Market, Riddhi Siddhi Circle, Gopal Pura By Pass, Jaipur-302018
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email Us</h3>
              <p>info@themaxbrain.com</p>
              <p>support@themaxbrain.com</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Call Us</h3>
              <p>+91 9950143179</p>
              <p>+91 7597493655</p>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="bg-white p-8 rounded shadow">
          <h3 className="text-xl font-semibold mb-6">Send us a message</h3>
          {success && <p className="text-green-600 mb-4">Message sent successfully!</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Your name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>
            <input
              type="text"
              name="subject"
              placeholder="How can we help?"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <textarea
              name="message"
              placeholder="Tell us about your project..."
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            ></textarea>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
              <span>📧</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}








// export default function Contact() {
//   return <div className="p-10 text-3xl font-bold">Contact Page</div>;
// }
