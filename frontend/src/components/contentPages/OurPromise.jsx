import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield, HeartHandshake, Target, Award, CheckCircle, Users, Zap, Home, Clock, DollarSign, ShieldCheck, TrendingUp } from "lucide-react";
const promises = [
    {
        icon: ShieldCheck,
        title: "Trust & Quality",
        description: "Every product we sell reflects our promise of trust, quality, and care. We carefully select products from trusted brands and manufacturers.",
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: HeartHandshake,
        title: "Long-term Relationships",
        description: "We believe in building lasting relationships with our customers. Your satisfaction is our priority, today and always.",
        color: "from-pink-500 to-rose-500"
    },
    {
        icon: DollarSign,
        title: "Fair Pricing",
        description: "Transparent pricing with no hidden costs. We bring high-quality appliances at fair prices with excellent value for money.",
        color: "from-green-500 to-emerald-500"
    },
    {
        icon: Clock,
        title: "Durability",
        description: "Focus on quality and durability ensures long-lasting performance. Our appliances are designed for everyday reliability.",
        color: "from-orange-500 to-amber-500"
    },
    {
        icon: Shield,
        title: "Customer-First Service",
        description: "Excellent customer service, transparent pricing, and dependable after-sales support. We help you make the right choice.",
        color: "from-purple-500 to-violet-500"
    },
    {
        icon: Users,
        title: "Customer Satisfaction",
        description: "Strong focus on customer satisfaction. We're committed to making your everyday life easier and more comfortable.",
        color: "from-indigo-500 to-blue-500"
    }
];
const offerings = [
    {
        icon: Home,
        title: "Kitchen Appliances",
        description: "Wide range of modern kitchen essentials"
    },
    {
        icon: Zap,
        title: "Home & Utility",
        description: "Appliances for every household need"
    },
    {
        icon: Shield,
        title: "Energy Efficient",
        description: "Eco-friendly and cost-saving products"
    },
    {
        icon: Award,
        title: "Trusted Brands",
        description: "Genuine items from reputable manufacturers"
    },
    {
        icon: DollarSign,
        title: "Competitive Pricing",
        description: "Best value for your money"
    },
    {
        icon: Users,
        title: "Customer Support",
        description: "Friendly and reliable service"
    }
];
const OurPromise = () => {
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
                  <Shield className="w-4 h-4"/>
                  Our Commitment
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Our Promise to{" "}
                <span className="text-accent">You</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                At Sri Krishna Home Appliances, every product we sell and every service we provide reflects 
                our promise of trust, quality, and care. We believe in building long-term relationships with 
                our customers.
              </p>
            </div>
          </div>
        </section>

        {/* Our Promise Grid */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                What We <span className="text-accent">Promise</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Our commitments that define who we are and how we serve you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {promises.map((promise, index) => {
            const Icon = promise.icon;
            return (<div key={promise.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${promise.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                    
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${promise.color} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-7 h-7 text-white"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                      {promise.title}
                    </h3>
                    <p className="text-muted-foreground text-justify text-sm leading-relaxed">
                      {promise.description}
                    </p>
                  </div>);
        })}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Mission */}
              <div data-aos="fade-right" className="bg-card rounded-2xl p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-6">
                  <Target className="w-7 h-7 text-accent"/>
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Our Mission
                </h2>
                <p className="text-muted-foreground text-sm text-justify leading-relaxed mb-6">
                  To bring high-quality home appliances at fair prices while ensuring excellent 
                  customer service. We help customers make the right choice by offering genuine 
                  products, transparent pricing, and dependable after-sales support.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">High-quality appliances at fair prices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">Excellent customer service</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">Transparent pricing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">Dependable after-sales support</span>
                  </div>
                </div>
              </div>

              {/* Vision */}
              <div data-aos="fade-left" className="bg-card rounded-2xl p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-6">
                  <Award className="w-7 h-7 text-accent"/>
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Our Vision
                </h2>
                <p className="text-muted-foreground text-sm text-justify leading-relaxed mb-6">
                  To become a leading and trusted home appliance store, known for reliability, 
                  innovation, and customer-first service, while continuously adapting to modern 
                  home needs.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">Leading home appliance store</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">Known for reliability and innovation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">Customer-first service approach</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                    <span className="text-foreground">Adapting to modern home needs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                What We <span className="text-accent">Offer</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Our comprehensive range of products and services
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {offerings.map((offer, index) => {
            const Icon = offer.icon;
            return (<div key={offer.title} data-aos="fade-up" data-aos-delay={index * 100} className="group bg-card rounded-2xl p-6 border border-border/60 hover:border-accent/50 hover:shadow-xl transition-all duration-300">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-5 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-6 h-6 text-accent"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {offer.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {offer.description}
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
                Experience Our Promise
              </h2>
              <p className="text-accent-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Visit our store or contact us today to experience the Sri Krishna Home Appliances difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => window.location.href = '/products'} className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl">
                  Shop Now
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
export default OurPromise;
