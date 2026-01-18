import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FileText, AlertCircle, ShoppingBag, CreditCard, Truck, RefreshCcw, Shield, Gavel, Mail, Phone, CheckCircle } from "lucide-react";
const sections = [
    {
        icon: ShoppingBag,
        title: "Use of Our Services",
        points: [
            "You agree to provide accurate and complete information when using our services",
            "You agree not to misuse our services for any unlawful activity",
            "You agree to follow all applicable laws and regulations"
        ],
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: AlertCircle,
        title: "Products & Availability",
        points: [
            "Product images are for illustration purposes only",
            "Prices and availability are subject to change without prior notice",
            "We reserve the right to limit quantities or discontinue products at any time"
        ],
        color: "from-orange-500 to-amber-500"
    },
    {
        icon: CreditCard,
        title: "Pricing & Payments",
        points: [
            "All prices are listed in Indian Rupees (INR)",
            "Payments must be completed before product delivery or pickup",
            "We reserve the right to cancel orders in case of pricing errors or payment issues"
        ],
        color: "from-green-500 to-emerald-500"
    },
    {
        icon: Truck,
        title: "Delivery & Installation",
        points: [
            "Delivery timelines may vary based on location and product availability",
            "Installation services, if provided, will be as per company or brand guidelines",
            "Delays caused by external factors are not our responsibility"
        ],
        color: "from-purple-500 to-violet-500"
    },
    {
        icon: RefreshCcw,
        title: "Returns & Refunds",
        points: [
            "Returns and refunds are governed by our Return Policy and Refund Policy",
            "Products must be unused and in original condition for eligibility",
            "Certain items may not be eligible for return"
        ],
        color: "from-pink-500 to-rose-500"
    },
    {
        icon: Shield,
        title: "Warranty",
        points: [
            "Product warranties are provided by the manufacturer",
            "Sri Krishna Home Appliances is not responsible for manufacturer warranty claims",
            "We will assist customers with warranty claims when possible"
        ],
        color: "from-indigo-500 to-blue-500"
    },
    {
        icon: Gavel,
        title: "User Responsibilities",
        points: [
            "Not to damage or interfere with website functionality",
            "Not to use false or misleading information",
            "To respect store staff and policies"
        ],
        color: "from-red-500 to-rose-500"
    }
];
const legalSections = [
    {
        title: "Limitation of Liability",
        description: "Sri Krishna Home Appliances is not liable for indirect, incidental, or consequential damages arising from the use of our products or services.",
        icon: Shield
    },
    {
        title: "Changes to Terms",
        description: "We reserve the right to update or modify these Terms & Conditions at any time. Changes will be effective immediately upon posting on this page. We recommend checking this page periodically for updates.",
        icon: AlertCircle
    },
    {
        title: "Governing Law",
        description: "These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of local courts in Nagapattinam, Tamil Nadu.",
        icon: Gavel
    }
];
const TermsConditions = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
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
                  <FileText className="w-4 h-4"/>
                  Legal Information
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Terms & <span className="text-accent">Conditions</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Welcome to Sri Krishna Home Appliances. By accessing or using our website, store 
                services, or purchasing our products, you agree to comply with these Terms & Conditions.
              </p>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto" data-aos="fade-up">
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-accent"/>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                      Important Notice
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-md">
                      Please read these Terms & Conditions carefully before using our services. 
                      By using our website or visiting our store, you agree to be bound by these terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14" data-aos="fade-up">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Terms & <span className="text-accent">Conditions</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Comprehensive guidelines for using our services
                </p>
              </div>

              <div className="space-y-8">
                {sections.map((section, index) => {
            const Icon = section.icon;
            return (<div key={section.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 md:p-8 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
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
                      
                      <div className="bg-background rounded-xl p-6 border border-border">
                        <ul className="space-y-3">
                          {section.points.map((point, i) => (<li key={i} className="flex text-sm ms:text-md items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                              <span className="text-foreground">{point}</span>
                            </li>))}
                        </ul>
                      </div>
                    </div>);
        })}
              </div>

              {/* Additional Legal Sections */}
              <div className="mt-14">
                <div className="text-center mb-10" data-aos="fade-up">
                  <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
                    Additional <span className="text-accent">Legal Information</span>
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Important legal details for your reference
                  </p>
                </div>

                <div className="space-y-6">
                  {legalSections.map((section, index) => {
            const Icon = section.icon;
            return (<div key={section.title} data-aos="fade-up" data-aos-delay={index * 100} className="bg-card rounded-2xl p-6 border border-border hover:border-accent/50 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                            <Icon className="w-5 h-5 text-accent"/>
                          </div>
                          <h3 className="font-heading text-xl font-bold text-foreground">
                            {section.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{section.description}</p>
                      </div>);
        })}
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-14 bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300" data-aos="fade-up">
                <div className="text-center mb-8">
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                    Contact for <span className="text-accent">Legal Inquiries</span>
                  </h3>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    For any questions regarding these Terms & Conditions, please contact us:
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

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    We typically respond to legal inquiries within 24-48 hours.
                  </p>
                </div>
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
                Need Clarification?
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                If you have any questions about our terms or policies, our team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => window.location.href = '/contact'} className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl">
                  Contact Our Legal Team
                </button>
                <button onClick={() => window.location.href = '/privacy-policy'} className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300">
                  View Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default TermsConditions;
