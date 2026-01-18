import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HelpCircle, Phone, Mail, Home, Clock, Users, Shield, Truck, CheckCircle } from "lucide-react";
const HelpSupport = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const supportCategories = [
        {
            icon: Phone,
            title: "Phone Support",
            description: "Call us for immediate assistance",
            details: ["Sales & Enquiries: +91 XXXXXXXXXX", "Service Support: +91 XXXXXXXXXX"],
            action: "tel:+91XXXXXXXXXX",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Home,
            title: "Store Visit",
            description: "Visit us for personalized help",
            details: ["Expert advice in person", "Product demonstrations", "Direct issue resolution"],
            action: null,
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: Mail,
            title: "Email Support",
            description: "Write to us for detailed queries",
            details: ["General: support@srikrishnahomeappliances.com", "Response within 24 hours"],
            action: "mailto:support@srikrishnahomeappliances.com",
            color: "from-purple-500 to-violet-500"
        }
    ];
    const services = [
        {
            icon: Shield,
            title: "Warranty Support",
            description: "Comprehensive warranty coverage for all products"
        },
        {
            icon: Truck,
            title: "Delivery Queries",
            description: "Track your order and delivery schedules"
        },
        {
            icon: Users,
            title: "Installation Help",
            description: "Professional installation guidance and support"
        },
        {
            icon: Clock,
            title: "Service Timing",
            description: "Information about our service hours and response times"
        }
    ];
    const faqItems = [
        {
            question: "What is your return policy?",
            answer: "We offer a 7-day return policy for unused products in original packaging. Contact us for return authorization."
        },
        {
            question: "Do you provide installation services?",
            answer: "Yes, we provide professional installation services for most appliances. Charges may apply for complex installations."
        },
        {
            question: "What is the warranty period?",
            answer: "Warranty periods vary by product and manufacturer. Typically ranges from 1 to 5 years. Check product documentation for details."
        },
        {
            question: "How can I track my delivery?",
            answer: "Delivery tracking information is provided via SMS/email. You can also call our delivery support number for updates."
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
                  <HelpCircle className="w-4 h-4"/>
                  Help & Support
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                How Can We{" "}
                <span className="text-accent">Help You?</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Get support for product selection, installation, warranty, or any other queries.
              </p>
            </div>
          </div>
        </section>

        {/* Support Categories */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Get <span className="text-accent">Support</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Choose your preferred way to connect with us
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {supportCategories.map((category, index) => {
            const Icon = category.icon;
            const Component = category.action ? 'a' : 'div';
            return (<Component key={category.title} href={category.action || undefined} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                    
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                    <ul className="space-y-2">
                      {category.details.map((detail, i) => (<li key={i} className="text-foreground text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"/>
                          {detail}
                        </li>))}
                    </ul>
                  </Component>);
        })}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our <span className="text-accent">Services</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Comprehensive support for all your appliance needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {services.map((service, index) => {
            const Icon = service.icon;
            return (<div key={service.title} data-aos="fade-up" data-aos-delay={index * 100} className="group bg-card rounded-2xl p-6 border border-border/60 hover:border-accent/50 hover:shadow-xl transition-all duration-300">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-5 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-6 h-6 text-accent"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {service.description}
                    </p>
                  </div>);
        })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Frequently Asked <span className="text-accent">Questions</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Find quick answers to common questions
              </p>
            </div>

            <div className="max-w-3xl mx-auto" data-aos="fade-up">
              <div className="space-y-4">
                {faqItems.map((faq, index) => (<div key={index} className="group bg-card rounded-2xl p-6 border border-border/60 hover:border-accent/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <HelpCircle className="w-5 h-5 text-accent"/>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-muted-foreground text-justify">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Contact */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/80 to-accent/60"/>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"/>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center" data-aos="zoom-in">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-accent-foreground mb-6">
                Need Immediate Help?
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                Our support team is ready to assist you with any issues or questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+91XXXXXXXXXX" className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl flex items-center gap-3 justify-center">
                  <Phone className="w-5 h-5"/>
                  Call Support Now
                </a>
                <a href="mailto:support@srikrishnahomeappliances.com" className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300 flex items-center gap-3 justify-center">
                  <Mail className="w-5 h-5"/>
                  Send Email
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default HelpSupport;
