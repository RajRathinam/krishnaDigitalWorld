import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Wrench, Clock, CheckCircle, Users, Shield, Home, Award, Star, Phone, Mail } from "lucide-react";
const InstallationSupport = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const timeline = [
        { day: "Day 1", title: "Product Delivery", description: "Safe delivery of your appliance" },
        { day: "Day 2", title: "Installation Visit", description: "Professional installation by experts" },
        { day: "Ongoing", title: "Support & Service", description: "Continued technical support" }
    ];
    const services = [
        {
            icon: Users,
            title: "What We Provide",
            items: [
                "Certified installation technicians",
                "Professional tools and equipment",
                "Compliance with safety standards",
                "Demo of product usage",
                "Cleaning after installation",
                "Basic troubleshooting guidance"
            ],
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Shield,
            title: "Preparation Checklist",
            items: [
                "Ensure the installation area is clean and accessible",
                "Have necessary power outlets ready",
                "Keep the product unpacked and accessible",
                "Be available during the installation time",
                "Have your purchase receipt ready for verification",
                "Clear any obstacles from the installation path"
            ],
            color: "from-green-500 to-emerald-500"
        }
    ];
    const benefits = [
        {
            icon: Award,
            title: "Certified Technicians",
            description: "Trained and certified by manufacturers"
        },
        {
            icon: Home,
            title: "Proper Equipment",
            description: "Professional tools for perfect installation"
        },
        {
            icon: Home,
            title: "Safety First",
            description: "Strict adherence to safety protocols"
        },
        {
            icon: Star,
            title: "Quality Assurance",
            description: "Thorough testing after installation"
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
                  <Wrench className="w-4 h-4"/>
                  Installation Support
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Professional{" "}
                <span className="text-accent">Installation</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Get expert installation for your home appliances by certified professionals.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Installation <span className="text-accent">Timeline</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Our systematic approach ensures smooth installation experience
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl">
                    <Clock className="w-7 h-7 text-accent"/>
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">
                      Installation Process
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Our installation team will visit your location the next day after delivery.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {timeline.map((item, index) => (<div key={item.title} data-aos="fade-up" data-aos-delay={index * 100} className="group text-center bg-background rounded-xl p-6 border border-border hover:border-accent/50 hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform">
                        {item.day}
                      </div>
                      <h4 className="font-heading text-lg font-semibold text-foreground mb-1">
                        {item.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>))}
                </div>

                <p className="text-muted-foreground mt-6 text-center text-sm">
                  Installation is carried out as per the manufacturer's guidelines and standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our <span className="text-accent">Services</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Comprehensive installation support for all your appliances
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {services.map((service, index) => {
            const Icon = service.icon;
            return (<div key={service.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 md:p-8 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${service.color}`}>
                          <Icon className="w-6 h-6 text-white"/>
                        </div>
                        <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                          {service.title}
                        </h3>
                      </div>
                      
                      <ul className="space-y-3 text-sm md:text-md">
                        {service.items.map((item, i) => (<li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                            <span className="text-foreground">{item}</span>
                          </li>))}
                      </ul>
                    </div>);
        })}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose Our <span className="text-accent">Installation</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Experience hassle-free installation with our expert team
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (<div key={benefit.title} data-aos="fade-up" data-aos-delay={index * 100} className="group bg-card rounded-2xl p-6 border border-border/60 hover:border-accent/50 hover:shadow-xl transition-all duration-300 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-5 mx-auto group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-7 h-7 text-accent"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>);
        })}
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
                Need Installation Support?
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                Schedule your appliance installation with our certified professionals
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+91XXXXXXXXXX" className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl flex items-center gap-3 justify-center">
                  <Phone className="w-5 h-5"/>
                  Schedule Installation
                </a>
                <a href="mailto:support@srikrishnahomeappliances.com" className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300 flex items-center gap-3 justify-center">
                  <Mail className="w-5 h-5"/>
                  Email Query
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default InstallationSupport;
