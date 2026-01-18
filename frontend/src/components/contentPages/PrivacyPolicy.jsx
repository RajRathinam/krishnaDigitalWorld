import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield, Lock, Database, Eye, Cookie, Link as LinkIcon, Mail, Phone, FileText, AlertCircle, CheckCircle } from "lucide-react";
const PrivacyPolicy = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const policySections = [
        {
            icon: Database,
            title: "Information We Collect",
            color: "from-blue-500 to-cyan-500",
            content: "We may collect the following information when you visit our website or contact us:",
            items: [
                "Name - For personal identification",
                "Phone number - For order updates and support",
                "Email address - For communication and offers",
                "Address - For delivery or service purposes",
                "Voluntary information - Any information you provide through contact forms or inquiries"
            ]
        },
        {
            icon: Eye,
            title: "How We Use Your Information",
            color: "from-green-500 to-emerald-500",
            content: "Your information is used only for the following purposes:",
            items: [
                "Order Processing - To process orders and service requests",
                "Customer Support - To contact you regarding products, offers, or support",
                "Service Improvement - To improve our services and customer experience",
                "Query Response - To respond to your queries and feedback"
            ]
        },
        {
            icon: Lock,
            title: "Data Protection",
            color: "from-purple-500 to-violet-500",
            content: "We take appropriate security measures to protect your personal information from unauthorized access, misuse, or disclosure. Your data is handled responsibly and securely.",
            items: [
                "Secure Storage - Encrypted storage of sensitive information",
                "Access Control - Limited access to authorized personnel only",
                "Regular Security Updates - Keeping our systems protected",
                "Employee Training - On data privacy and security practices"
            ]
        },
        {
            icon: FileText,
            title: "Sharing of Information",
            color: "from-orange-500 to-amber-500",
            content: "We respect your privacy and handle your information responsibly:",
            warning: "No Selling or Sharing: We do not sell, rent, or trade your personal information to third parties for marketing purposes.",
            note: "Service Fulfillment: Information may only be shared when required by law or for service fulfillment (such as delivery to our logistics partners)."
        },
        {
            icon: Cookie,
            title: "Cookies",
            color: "from-pink-500 to-rose-500",
            content: "Our website may use cookies to enhance user experience:",
            items: [
                "Cookies help us understand website usage and improve functionality",
                "They enable personalized browsing experience",
                "You can disable cookies in your browser settings if you prefer",
                "No personally identifiable information is stored in cookies"
            ]
        },
        {
            icon: LinkIcon,
            title: "Third-Party Links",
            color: "from-indigo-500 to-blue-500",
            content: "Our website may contain links to third-party websites. Please note:",
            warning: "Disclaimer: We are not responsible for the privacy practices or content of those external sites. We recommend reviewing their privacy policies before sharing any personal information."
        }
    ];
    return (<div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-accent/5"/>
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float"/>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}/>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div data-aos="fade-up">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6">
                  <Shield className="w-4 h-4"/>
                  Privacy & Security
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Privacy <span className="text-accent">Policy</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                At Sri Krishna Home Appliances, we value your trust and are committed to protecting 
                your privacy. This policy explains how we collect, use, and safeguard your information.
              </p>
            </div>
          </div>
        </section>

        {/* Last Updated */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-accent/50 transition-all duration-300" data-aos="fade-up">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                    <AlertCircle className="w-5 h-5 text-accent"/>
                  </div>
                  <div>
                    <p className="text-foreground text-justify">
                      <strong className="font-heading">Last Updated:</strong> This Privacy Policy was last updated on [15-01-2026]. 
                      We may update this policy from time to time. Any changes will be posted on this page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Sections */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-12">
              {policySections.map((section, index) => {
            const Icon = section.icon;
            return (<div key={section.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${section.color}`}>
                        <Icon className="w-6 h-6 text-white"/>
                      </div>
                      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                        {section.title}
                      </h2>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-6">{section.content}</p>
                    
                    {section.items && (<ul className="space-y-3 text-sm">
                        {section.items.map((item, i) => (<li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                            <span className="text-foreground">{item}</span>
                          </li>))}
                      </ul>)}
                    
                    {section.warning && (<div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-foreground text-sm text-justify">
                          <strong className="font-heading text-red-500">Important:</strong> {section.warning}
                        </p>
                      </div>)}
                    
                    {section.note && (<div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-foreground text-sm text-justify">
                          <strong className="font-heading text-blue-500">Note:</strong> {section.note}
                        </p>
                      </div>)}
                  </div>);
        })}
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-10 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border">
                <div className="text-center mb-10">
                  <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
                    Contact <span className="text-accent">Us</span>
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    If you have any questions about this Privacy Policy or your personal data, please contact us:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-background rounded-xl border border-border">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                      <Mail className="w-5 h-5 text-accent"/>
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-foreground">Email</h4>
                      <a href="mailto:support@srikrishnahomeappliances.com" className="text-accent text-xs hover:text-accent/80 transition-colors">
                        support@srikrishnahomeappliances.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4 p-4 bg-background rounded-xl border border-border">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                      <Phone className="w-5 h-5 text-accent"/>
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-foreground">Phone</h4>
                      <a href="tel:+91XXXXXXXXXX" className="text-accent text-xs hover:text-accent/80 transition-colors">
                        +91 XXXXXXXXXX
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-center text-xs md:text-sm">
                  We typically respond to privacy-related inquiries within 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/80 to-accent/60"/>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"/>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center" data-aos="zoom-in">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-accent-foreground mb-6">
                Your Privacy Matters
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                We are committed to protecting your personal information and maintaining your trust.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => window.location.href = '/contact'} className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl">
                  Contact Our Privacy Team
                </button>
                <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300">
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default PrivacyPolicy;
