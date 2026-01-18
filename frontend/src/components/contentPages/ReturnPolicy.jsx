import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { XCircle, Package, ShieldCheck, Home, Phone, AlertTriangle, CheckCircle, Users, Target, Star, Shield, Zap } from "lucide-react";
const ReturnPolicy = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const policyDetails = [
        {
            title: "No Return Policy",
            icon: XCircle,
            description: "Returns are not accepted for any products sold.",
            points: [
                "This policy applies to all items",
                "No returns under any circumstances",
                "Customers must verify product details before purchase"
            ],
            color: "from-red-500 to-rose-500"
        },
        {
            title: "Quality Assurance",
            icon: ShieldCheck,
            description: "We provide only quality-checked and verified products.",
            points: [
                "All products thoroughly inspected",
                "Tested before delivery",
                "Proper working condition guaranteed"
            ],
            color: "from-green-500 to-emerald-500"
        },
        {
            title: "Open Box Delivery",
            icon: Package,
            description: "Transparent delivery with product verification.",
            points: [
                "All products delivered with open box",
                "Customers inspect at delivery time",
                "No returns after acceptance"
            ],
            color: "from-blue-500 to-cyan-500"
        }
    ];
    const qualityProcess = [
        "Multi-stage quality checking process",
        "Functional testing of all appliances",
        "Visual inspection for defects",
        "Packaging verification",
        "Final approval before dispatch"
    ];
    const customerSupport = [
        "Visit store for any concerns",
        "Warranty support guidance",
        "Service coordination assistance",
        "Technical advice and solutions",
        "Manufacturer liaison support"
    ];
    const deliverySteps = [
        {
            number: "1",
            title: "Delivery Arrival",
            description: "Our delivery team arrives with your product"
        },
        {
            number: "2",
            title: "Box Opening",
            description: "We open the packaging in front of you"
        },
        {
            number: "3",
            title: "Product Inspection",
            description: "You inspect the appliance thoroughly"
        },
        {
            number: "4",
            title: "Acceptance",
            description: "Only accept if completely satisfied"
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
                  <Package className="w-4 h-4"/>
                  Return Policy
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Return <span className="text-accent">Policy</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Customer satisfaction and product quality are our top priorities. 
                Please read this return policy carefully before purchasing.
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
                      Important Policy Notice
                    </h3>
                    <p className="text-muted-foreground text-justify">
                      We do not accept returns for any products. All sales are final. 
                      Please verify your requirements and product details before purchase.
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {policyDetails.map((policy, index) => {
            const Icon = policy.icon;
            return (<div key={policy.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${policy.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                      
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${policy.color} mb-5`}>
                        <Icon className="w-6 h-6 text-white"/>
                      </div>
                      <h3 className="font-heading text-xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                        {policy.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {policy.description}
                      </p>
                      <ul className="space-y-2">
                        {policy.points.map((point, i) => (<li key={i} className="flex items-start gap-2 text-foreground text-sm">
                            <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"/>
                            {point}
                          </li>))}
                      </ul>
                    </div>);
        })}
              </div>
            </div>
          </div>
        </section>

        {/* Quality Assurance Details */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our <span className="text-accent">Quality Assurance</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Why returns are not needed with our products
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">
                      Stringent Quality Checks
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <p className="text-muted-foreground">
                    Every product at Sri Krishna Home Appliances undergoes multiple levels of 
                    quality verification to ensure you receive only the best. Our rigorous 
                    testing process eliminates the need for returns.
                  </p>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-heading text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-accent"/>
                        Quality Control Steps
                      </h4>
                      <ul className="space-y-4">
                        {qualityProcess.map((step, index) => (<li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                            <span className="text-foreground">{step}</span>
                          </li>))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-heading text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                        <Star className="w-5 h-5 text-accent"/>
                        Customer Benefits
                      </h4>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-2">
                          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Assured product quality</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Verified functionality</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Perfect condition delivery</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">Peace of mind purchase</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Box Delivery Details */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Open Box <span className="text-accent">Delivery</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                See and verify your product before acceptance
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <Package className="w-5 h-5 text-accent"/>
                      How It Works
                    </h3>
                    <div className="space-y-6">
                      {deliverySteps.map((step, index) => (<div key={step.number} className="flex items-start gap-4">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                            <span className="text-accent font-bold font-heading">{step.number}</span>
                          </div>
                          <div>
                            <p className="font-heading font-semibold text-foreground mb-1">{step.title}</p>
                            <p className="text-muted-foreground text-sm">{step.description}</p>
                          </div>
                        </div>))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent"/>
                      Your Responsibilities
                    </h3>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                        <span className="text-foreground">Be present during delivery</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                        <span className="text-foreground">Inspect product carefully</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                        <span className="text-foreground">Check all components</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                        <span className="text-foreground">Report issues immediately</span>
                      </li>
                    </ul>
                    
                    <div className="p-4 bg-card rounded-xl border border-border">
                      <p className="text-foreground text-sm text-justify">
                        <strong className="font-heading text-accent">Note:</strong> Once you accept the product during open box delivery, 
                        no return or replacement will be allowed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Support */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Customer <span className="text-accent">Support</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We're here to help with any concerns
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">
                      Visit Our Store
                    </h3>
                    <p className="text-muted-foreground">
                      Direct support for all your product concerns
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent"/>
                      How We Can Help
                    </h4>
                    <ul className="space-y-4">
                      {customerSupport.map((support, index) => (<li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                          <span className="text-foreground">{support}</span>
                        </li>))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent"/>
                      Contact Information
                    </h4>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                          <Home className="w-5 h-5 text-accent"/>
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-foreground mb-1">Store Address</p>
                          <p className="text-muted-foreground text-sm">
                            Sri Krishna Home Appliances<br />
                            Nagapattinam
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                          <Phone className="w-5 h-5 text-accent"/>
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-foreground mb-1">Phone Support</p>
                          <a href="tel:+91XXXXXXXXXX" className="text-accent hover:text-accent/80 transition-colors">
                            +91 XXXXXXXXXX
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-card rounded-xl border border-border">
                      <p className="text-foreground text-sm">
                        <strong className="font-heading text-accent">Store Hours:</strong> Monday to Saturday: 9 AM - 8 PM, 
                        Sunday: 10 AM - 6 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/80 to-accent/60"/>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"/>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center" data-aos="zoom-in">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-accent-foreground mb-6">
                Shop With Confidence
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                Our quality assurance and open box delivery ensure you get perfect products every time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => window.location.href = '/products'} className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl">
                  Browse Products
                </button>
                <button onClick={() => window.location.href = '/contact'} className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default ReturnPolicy;
