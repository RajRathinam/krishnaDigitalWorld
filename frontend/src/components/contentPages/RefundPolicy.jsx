import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlertTriangle, Package, Shield, Wrench, Home, Phone, Mail, XCircle, CheckCircle, DollarSign, Users, Target, Star } from "lucide-react";
const RefundPolicy = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const policyPoints = [
        {
            icon: XCircle,
            title: "No Refund Policy",
            description: "Once an order is placed, refunds are not provided.",
            details: [
                "No refunds after order placement",
                "Orders cannot be cancelled after confirmation",
                "Customers must verify product details before purchasing"
            ],
            color: "from-red-500 to-rose-500"
        },
        {
            icon: Package,
            title: "Open Box Delivery",
            description: "All products are delivered with open box delivery.",
            details: [
                "Customers must inspect products at delivery time",
                "Report any issues immediately during delivery",
                "No refund or replacement after product acceptance"
            ],
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Shield,
            title: "Warranty Coverage",
            description: "All products covered under manufacturer warranty.",
            details: [
                "Warranty terms defined by respective brands",
                "Contact manufacturer for warranty claims",
                "We assist with warranty processes when possible"
            ],
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: Wrench,
            title: "Installation Support",
            description: "Professional installation services available.",
            details: [
                "Installation team visits next day after delivery",
                "Carried out as per brand guidelines",
                "Scheduled at customer convenience"
            ],
            color: "from-purple-500 to-violet-500"
        }
    ];
    const issueResolution = [
        "If you face any product issues, visit our shop directly",
        "Our staff will guide you with appropriate solutions",
        "We assist with warranty claims and service requests",
        "Technical support available during store hours",
        "Product demos available at store for clarity"
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
                  <AlertTriangle className="w-4 h-4"/>
                  Refund Information
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Refund <span className="text-accent">Policy</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                At Sri Krishna Home Appliances, we aim to provide genuine and quality products. 
                Please read our refund policy carefully before making a purchase.
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
                    <AlertTriangle className="w-6 h-6 text-red-500"/>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                      Important: No Refund Policy
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-md text-justify">
                      We do not provide refunds once an order is placed. Please verify all product details 
                      carefully before completing your purchase.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Details */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Policy <span className="text-accent">Details</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Understanding our terms and conditions
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policyPoints.map((point, index) => {
            const Icon = point.icon;
            return (<div key={point.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${point.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                      
                      <div className="flex items-center gap-4 mb-5">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${point.color}`}>
                          <Icon className="w-6 h-6 text-white"/>
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
                          {point.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground mb-4 md:text-md text-sm">
                        {point.description}
                      </p>
                      <ul className="space-y-2">
                        {point.details.map((detail, i) => (<li key={i} className="flex items-start gap-3 text-foreground text-sm">
                            <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"/>
                            {detail}
                          </li>))}
                      </ul>
                    </div>);
        })}
              </div>
            </div>
          </div>
        </section>

        {/* Issue Resolution */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Issue <span className="text-accent">Resolution</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                How we handle product concerns and support requests
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl">
                    <Home className="w-7 h-7 text-accent"/>
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">
                      Visit Our Store for Support
                    </h3>
                    <p className="text-muted-foreground">
                      Direct assistance for all your product concerns
                    </p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <p className="text-muted-foreground">
                    If you face any issues related to products, delivery, or warranty, 
                    please visit our shop directly for assistance. Our experienced staff will 
                    guide you through the appropriate solution process.
                  </p>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-5 h-5 text-accent"/>
                        What to Bring
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Original purchase receipt</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Product warranty card</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Any relevant documents</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-5 h-5 text-accent"/>
                        Our Support Includes
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Warranty claim assistance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Service coordination</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Technical guidance</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-4 md:p-6 border border-border mt-6">
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-accent"/>
                      Important Notes
                    </h4>
                    <ul className="space-y-3 ">
                      {issueResolution.map((point, index) => (<li key={index} className="flex items-start gap-3 text-foreground">
                          <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                          {point}
                        </li>))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quality Assurance */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Quality <span className="text-accent">Assurance</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Why our products don't require refunds
              </p>
            </div>

            <div data-aos="fade-up" className="max-w-4xl mx-auto bg-card rounded-2xl p-8 border border-border hover:border-accent/50 transition-all duration-300">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent"/>
                    Our Quality Process
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">Quality-checked products only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">Thorough testing before delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">Verified and genuine items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">Proper working condition guaranteed</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent"/>
                    Customer Benefits
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">Manufacturer warranty on all products</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">Open box delivery for verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">After-sales service support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                      <span className="text-foreground">Store-based assistance anytime</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact for Support */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/80 to-accent/60"/>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"/>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center" data-aos="zoom-in">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-accent-foreground mb-6">
                Need Support?
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                Visit our store or contact us for product support, warranty claims, or any assistance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4 mx-auto">
                    <Home className="w-6 h-6 text-white"/>
                  </div>
                  <h3 className="font-heading font-semibold text-accent-foreground mb-2">Visit Store</h3>
                  <p className="text-accent-foreground/80 text-sm">
                    Sri Krishna Home Appliances<br />
                    Nagapattinam
                  </p>
                </div>
                <a href="tel:+91XXXXXXXXXX" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-white"/>
                  </div>
                  <h3 className="font-heading font-semibold text-accent-foreground mb-2">Call Us</h3>
                  <p className="text-accent-foreground/80 text-sm">+91 XXXXXXXXXX</p>
                </a>
                <a href="mailto:support@srikrishnahomeappliances.com" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-white"/>
                  </div>
                  <h3 className="font-heading font-semibold text-accent-foreground mb-2">Email Us</h3>
                  <p className="text-accent-foreground/80 text-sm">support@srikrishnahomeappliances.com</p>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default RefundPolicy;
