import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

const { t } = useTranslation();

const contactSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.enum(["support", "partnership", "feedback", "other"]),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      subject: "",
      message: "",
      category: "support",
    },
  });

  async function handleSubmit(data: ContactForm) {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Form submitted:", data);

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you within 24 hours.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      details: ["support@mcqgyaan.com", "info@mcqgyaan.com"],
      desc: "For quick support"
    },
    {
      icon: Phone,
      title: "Phone",
      details: ["+91 9950143179", "+91 7597493655"],
      desc: "Available 9 AM - 6 PM IST"
    },
    {
      icon: MapPin,
      title: "Office Location",
      details: ["SF-77 Jaipur Electronics Market", "Jaipur-302018, India"],
      desc: "MaxBrain Technologies Pvt. Ltd."
    },
    {
      icon: Clock,
      title: "Response Time",
      details: ["Within 24 hours", "Mon - Fri (Business Days)"],
      desc: "We respond quickly"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t("contact_title")}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {t("contact_desc")}
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((info, idx) => {
            const Icon = info.icon;
            return (
              <Card key={idx} className="p-6 hover-elevate transition-all">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg w-fit mb-4">
                  <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{info.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{info.desc}</p>
                <div className="space-y-1">
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {detail}
                    </p>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="bg-white dark:bg-gray-800 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-center mb-4">
              {t("send_message")}
            </h2>

            <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t("send_message_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Left side - Info */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                    {t("why_contact")}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("why_contact_desc")}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Common Inquiries
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                      {t("contact_support")}
                    </li>

                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                      {t("contact_partnership")}
                    </li>

                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                      {t("contact_feature_request")}
                    </li>

                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                      {t("contact_account_issue")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="lg:col-span-2">
              <Card className="p-8 shadow-lg">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Name and Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form_email")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John Doe"
                                {...field}
                                data-testid="input-fullname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form_email")}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Phone and Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form_phone")}</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+91 XXXXXXXXXX"
                                {...field}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form_category")}</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                data-testid="select-category"
                              >
                                <option value="support">{t("contact_support")}</option>
                                <option value="partnership">{t("contact_partnership")}</option>
                                <option value="feedback">{t("contact_feedback")}</option>
                                <option value="other">{t("contact_other")}</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Subject */}
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What is this regarding?"
                              {...field}
                              data-testid="input-subject"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Message */}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form_message")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us what's on your mind... (minimum 10 characters)"
                              rows={5}
                              {...field}
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg"
                      data-testid="button-submit"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t("sending")}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t("send_message_btn")}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      We'll get back to you within 24 business hours. Thank you!
                    </p>
                  </form>
                </Form>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("faq_title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            { q: t("faq_response_time_q"), a: t("faq_response_time_a") },
            { q: t("faq_school_discount_q"), a: t("faq_school_discount_a") },
            { q: t("faq_offline_q"), a: t("faq_offline_a") },
            { q: t("faq_free_trial_q"), a: t("faq_free_trial_a") },
            { q: t("faq_api_q"), a: t("faq_api_a") },
            { q: t("faq_data_security_q"), a: t("faq_data_security_a") }
          ].map((item, idx) => (
            <Card key={idx} className="p-6">
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{item.q}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{item.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
