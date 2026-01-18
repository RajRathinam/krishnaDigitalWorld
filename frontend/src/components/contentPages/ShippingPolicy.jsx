import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Truck, MapPin, Clock, Package, AlertCircle, Home, CheckCircle, Phone, Mail, Shield, Users, Target } from "lucide-react";
const ShippingPolicy = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const deliveryInfo = [
        {
            icon: MapPin,
            title: "Delivery Area",
            description: "We deliver only within and around Nagapattinam",
            details: ["Maximum delivery radius: Up to 30 km", "Orders outside this area are not eligible for delivery"],
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Clock,
            title: "Delivery Time",
            description: "Fast and reliable delivery service",
            details: [
                "Same-day delivery available for selected products",
                "Standard delivery time: 2–3 working days",
                "Delivery time may vary based on product availability and location"
            ],
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: Package,
            title: "Open Box Delivery",
            description: "Safe and transparent delivery process",
            details: [
                "We provide open box delivery",
                "Customers must check product condition at delivery",
                "Report any visible damage immediately during delivery"
            ],
            color: "from-orange-500 to-amber-500"
        },
        {
            icon: Home,
            title: "In-Store Purchase",
            description: "Visit us for instant purchase",
            details: [
                "Customers are welcome to visit our shop directly",
                "Check products in person and purchase instantly",
                "In-store pickup available for all products"
            ],
            color: "from-purple-500 to-violet-500"
        }
    ];
    const limitations = [
        "Delivery is subject to road accessibility and local conditions",
        "Installation, if required, will be arranged as per brand guidelines",
        "We reserve the right to cancel delivery if conditions are unsuitable",
        "Delivery charges may apply for certain locations (if any)",
        "Weekend deliveries available for most locations"
    ];
    const openBoxDetails = [
        {
            icon: Users,
            title: "Customer Responsibilities",
            items: [
                "Be present at delivery time",
                "Inspect product thoroughly",
                "Report any issues immediately",
                "Check all accessories and components"
            ]
        },
        {
            icon: Shield,
            title: "Our Guarantee",
            items: [
                "Complete product inspection",
                "Safe and careful handling",
                "Immediate issue resolution",
                "Quality verification before delivery"
            ]
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
                  <Truck className="w-4 h-4"/>
                  Delivery Information
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Shipping <span className="text-accent">Policy</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                At Sri Krishna Home Appliances, we offer local delivery to ensure fast and safe service 
                for our customers in and around Nagapattinam.
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
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10">
                    <AlertCircle className="w-6 h-6 text-accent"/>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                      Important Delivery Notice
                    </h3>
                    <p className="text-muted-foreground md:text-md text-justify text-sm">
                      We currently deliver only within 30km radius of Nagapattinam. 
                      Orders outside this area will need to be picked up from our store.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Information */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">
                Delivery <span className="text-accent">Information</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Everything you need to know about our delivery service
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deliveryInfo.map((info, index) => {
            const Icon = info.icon;
            return (<div key={info.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                      
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} mb-5`}>
                        <Icon className="w-6 h-6 text-white"/>
                      </div>
                      <h3 className="font-heading text-xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                        {info.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {info.description}
                      </p>
                      <ul className="space-y-2">
                        {info.details.map((detail, i) => (<li key={i} className="flex items-start gap-2 text-foreground text-sm">
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

        {/* Delivery Limitations */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Delivery <span className="text-accent">Limitations</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Important information about our delivery service
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <ul className="space-y-4 text-sm md:text-md">
                  {limitations.map((limitation, index) => (<li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                      </div>
                      <span className="text-foreground">{limitation}</span>
                    </li>))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Open Box Delivery Details */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Open Box <span className="text-accent">Delivery</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Ensuring you receive perfect products every time
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                      What is Open Box Delivery?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Complete transparency in product delivery
                    </p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <h4 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-accent"/>
                      Process Overview
                    </h4>
                    <p className="text-muted-foreground mb-6">
                      Open Box Delivery means we open the product packaging in front of you at the 
                      time of delivery so you can inspect the appliance before accepting it.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {openBoxDetails.map((detail, index) => {
            const Icon = detail.icon;
            return (<div key={detail.title} className="space-y-4">
                          <h4 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Icon className="w-5 h-5 text-accent"/>
                            {detail.title}
                          </h4>
                          <ul className="space-y-3">
                            {detail.items.map((item, i) => (<li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                                <span className="text-foreground">{item}</span>
                              </li>))}
                          </ul>
                        </div>);
        })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact for Delivery Queries */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/80 to-accent/60"/>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"/>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center" data-aos="zoom-in">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-accent-foreground mb-6">
                Delivery Questions?
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                Contact us for delivery scheduling, area coverage, or any delivery-related queries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+91XXXXXXXXXX" className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl flex items-center gap-3 justify-center">
                  <Phone className="w-5 h-5"/>
                  Call for Delivery Info
                </a>
                <a href="mailto:support@srikrishnahomeappliances.com?subject=Delivery%20Query" className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300 flex items-center gap-3 justify-center">
                  <Mail className="w-5 h-5"/>
                  Email Delivery Team
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default ShippingPolicy;
