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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Form submitted:", formData);
    setIsSubmitting(false);
    setSuccess(true);
    setFormData({ fullName: "", email: "", subject: "", message: "" });
  };

  return (
    <section
      className="min-h-screen py-16 
      bg-gradient-to-br from-blue-600 to-purple-700 
      dark:from-gray-900 dark:to-black"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left info */}
        <div className="text-white">
          <p className="text-white/80 font-semibold mb-2">Get In Touch</p>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Let's Start a{" "}
            <span className="text-yellow-300">Conversation</span>
          </h2>

          <p className="text-white/80 mb-8">
            Ready to bring your ideas to life? Contact us today—We blend
            innovation & technology for your project.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-yellow-300 mb-1">Our Location</h3>
              <p className="text-white/85">
                MaxBrain Technologies Pvt. Ltd.<br />
                SF-77 Jaipur Electronics Market, Riddhi Siddhi Circle, Gopal Pura By Pass, Jaipur-302018
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-yellow-300 mb-1">Email Us</h3>
              <p className="text-white/85">info@themaxbrain.com</p>
              <p className="text-white/85">support@themaxbrain.com</p>
            </div>

            <div>
              <h3 className="font-semibold text-yellow-300 mb-1">Call Us</h3>
              <p className="text-white/85">+91 9950143179</p>
              <p className="text-white/85">+91 7597493655</p>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div
          className="
          bg-white/20 dark:bg-white/10 
          backdrop-blur-xl 
          p-8 rounded-xl shadow-lg text-white
        "
        >
          <h3 className="text-xl font-semibold mb-6">Send us a message</h3>
          {success && (
            <p className="text-green-300 mb-4">
              Message sent successfully!
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Your name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="How can we help?"
              value={formData.subject}
              onChange={handleChange}
              className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />

            <textarea
              name="message"
              placeholder="Tell us about your project..."
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Sending..." : "Send Message"} 📧
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
