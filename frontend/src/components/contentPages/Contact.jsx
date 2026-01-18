import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MapPin, Phone, Mail, Clock, MessageCircle, Home, Truck, Shield, Users, Target } from "lucide-react";
const Contact = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const contactInfo = [
        {
            icon: MapPin,
            title: "Store Address",
            details: [
                "Sri Krishna Home Appliances",
                "Nagapattinam, Tamil Nadu",
                "Delivery within 30km radius"
            ],
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Phone,
            title: "Phone Numbers",
            details: [
                "Sales & Enquiries: +91 XXXXXXXXXX",
                "Service & Support: +91 XXXXXXXXXX"
            ],
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: Mail,
            title: "Email Addresses",
            details: [
                "General: support@srikrishnahomeappliances.com",
                "Careers: careers@srikrishnahomeappliances.com"
            ],
            color: "from-purple-500 to-violet-500"
        },
        {
            icon: Clock,
            title: "Store Timings",
            details: [
                "Monday - Saturday: 9:00 AM - 8:00 PM",
                "Sunday: 10:00 AM - 6:00 PM"
            ],
            color: "from-orange-500 to-amber-500"
        }
    ];
    const services = [
        {
            icon: Home,
            title: "In-Store Shopping",
            description: "Visit our store to see products in person and get expert advice",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Truck,
            title: "Delivery Service",
            description: "Local delivery within 30km radius of Nagapattinam",
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: Shield,
            title: "Installation Support",
            description: "Professional installation available for all products",
            color: "from-purple-500 to-violet-500"
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
                  <MessageCircle className="w-4 h-4"/>
                  Get in Touch
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Contact{" "}
                <span className="text-accent">Sri Krishna Home Appliances</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                We're here to help you with all your home appliance needs. 
                Visit our store, call us, or send us a message - we're always ready to assist you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (<div key={info.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                    
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                      {info.title}
                    </h3>
                    <ul className="space-y-1">
                      {info.details.map((detail, i) => (<li key={i} className="text-muted-foreground text-sm">
                          {detail}
                        </li>))}
                    </ul>
                  </div>);
        })}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our <span className="text-accent">Services</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Comprehensive solutions for all your home appliance needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {services.map((service, index) => {
            const Icon = service.icon;
            return (<div key={service.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                    
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>);
        })}
            </div>
          </div>
        </section>

        {/* Map & Directions */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Visit Our <span className="text-accent">Store</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Find us easily with these directions
              </p>
            </div>

            <div className="max-w-4xl mx-auto" data-aos="fade-up">
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="w-6 h-6 text-accent"/>
                      Store Location
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
                          <Target className="w-5 h-5 text-accent"/>
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-foreground mb-1">Address</p>
                          <p className="text-muted-foreground text-sm">
                            Sri Krishna Home Appliances<br />
                            Main Road, Nagapattinam<br />
                            Tamil Nadu - 611001
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
                          <Truck className="w-5 h-5 text-blue-500"/>
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-foreground mb-1">Delivery Area</p>
                          <p className="text-muted-foreground text-sm">
                            We deliver within 30km radius of Nagapattinam
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center justify-center md:justify-start gap-2">
                      <Users className="w-6 h-6 text-accent"/>
                      Getting Here
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <p className="text-foreground text-sm">
                          Located on the main road, easily accessible by public transport
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <p className="text-foreground text-sm">
                          Ample parking space available near the store
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <p className="text-foreground text-sm">
                          Well-connected by bus routes and auto-rickshaws
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <p className="text-foreground text-sm">
                          Wheelchair accessible entrance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="mt-10 bg-gradient-to-br from-accent/5 to-background rounded-xl md:p-8 p-4 border border-border flex flex-col items-center justify-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-5">
                    <MapPin className="w-7 h-7 text-accent"/>
                  </div>
                  <p className="font-heading text-lg font-semibold text-foreground">Sri Krishna Home Appliances</p>
                  <p className="text-muted-foreground text-sm">Nagapattinam, Tamil Nadu</p>
                  <p className="text-accent flex items-center gap-1 text-sm font-medium mt-4"><MapPin /> Click for Google Maps directions</p>
                </div>
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
                Need Immediate Assistance?
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                Call us now for quick help with product selection, pricing, or any other queries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+91XXXXXXXXXX" className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl flex items-center gap-3 justify-center">
                  <Phone className="w-5 h-5"/>
                  Call Now: +91 XXXXXXXXXX
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
export default Contact;
