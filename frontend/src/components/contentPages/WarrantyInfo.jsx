import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield, AlertCircle, CheckCircle, Home, FileText, Phone, Award } from "lucide-react";
const WarrantyInfo = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const warrantySections = [
        {
            icon: Shield,
            title: "Warranty Coverage",
            description: "Understanding your product warranty",
            points: [
                "Coverage varies by brand and product type",
                "Standard 1-2 years warranty on most appliances",
                "Extended warranty options available for some products",
                "Warranty terms defined by respective manufacturers",
                "Read manufacturer's warranty card for specific details"
            ],
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: FileText,
            title: "Claim Process",
            description: "How to claim warranty service",
            points: [
                "Visit our store with purchase receipt and warranty card",
                "We guide you through manufacturer's claim process",
                "Submit required documents for verification",
                "Track claim status through manufacturer service",
                "Get updates on service schedule"
            ],
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: AlertCircle,
            title: "Important Notes",
            description: "Key points about warranty service",
            points: [
                "Product warranties are provided by manufacturers",
                "Sri Krishna Home Appliances assists but is not responsible",
                "Warranty does not cover misuse or improper handling",
                "Regular maintenance extends product lifespan",
                "Keep all documents safe for future claims"
            ],
            color: "from-orange-500 to-amber-500"
        }
    ];
    const requiredDocuments = [
        {
            icon: FileText,
            title: "Original Purchase Invoice",
            description: "Proof of purchase with date and details"
        },
        {
            icon: Shield,
            title: "Warranty Card",
            description: "Filled and stamped by the manufacturer"
        },
        {
            icon: Award,
            title: "Product Serial Number",
            description: "Unique identifier for your appliance"
        },
        {
            icon: Home,
            title: "Accessory Parts",
            description: "If applicable for replacement"
        }
    ];
    const warrantyTips = [
        "Register your product with manufacturer for extended benefits",
        "Read warranty terms and conditions carefully",
        "Report issues within warranty period",
        "Regular cleaning and maintenance required",
        "Use as per manufacturer guidelines"
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
                  Warranty Information
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Product <span className="text-accent">Warranty</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Understand warranty coverage for your appliances and how to claim warranty service.
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
                      Important Notice
                    </h3>
                    <p className="text-muted-foreground text-justify">
                      Product warranties are provided by the respective manufacturers. 
                      Sri Krishna Home Appliances assists with warranty claims but is not 
                      responsible for manufacturer warranty terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Warranty Sections */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Warranty <span className="text-accent">Information</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Comprehensive details about product warranties and claim processes
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="space-y-8">
                {warrantySections.map((section, index) => {
            const Icon = section.icon;
            return (<div key={section.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-5 md:p-8 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${section.color}`}>
                          <Icon className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                          <h2 className="font-heading text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                            {section.title}
                          </h2>
                          <p className="text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                      
                      <div className="bg-background rounded-xl p-4 md:p-6 border border-border">
                        <ul className="space-y-3 text-sm md:text-md">
                          {section.points.map((point, i) => (<li key={i} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-1.5"/>
                              <span className="text-foreground">{point}</span>
                            </li>))}
                        </ul>
                      </div>
                    </div>);
        })}
              </div>
            </div>
          </div>
        </section>

        {/* Required Documents */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Required <span className="text-accent">Documents</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Essential documents for warranty claim processing
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {requiredDocuments.map((doc, index) => {
            const Icon = doc.icon;
            return (<div key={doc.title} data-aos="fade-up" data-aos-delay={index * 100} className="group bg-card rounded-2xl p-6 border border-border/60 hover:border-accent/50 hover:shadow-xl transition-all duration-300 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-5 mx-auto group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                        <Icon className="w-7 h-7 text-accent"/>
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {doc.description}
                      </p>
                    </div>);
        })}
              </div>
            </div>
          </div>
        </section>

        {/* Warranty Tips */}
        <section className="py-10 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Warranty <span className="text-accent">Tips</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Best practices for maintaining your warranty coverage
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div data-aos="fade-up" className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">
                      Maintenance Tips
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      How to keep your appliances in warranty condition
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <ul className="space-y-4 text-sm md:text-md">
                    {warrantyTips.map((tip, index) => (<li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                        <span className="text-foreground">{tip}</span>
                      </li>))}
                  </ul>

                  <div className="p-4 bg-card rounded-xl border border-border mt-6">
                    <p className="text-muted-foreground text-sm text-justify">
                      <strong className="font-heading text-accent">Note:</strong> Proper maintenance and 
                      usage as per manufacturer guidelines are essential for warranty validity. 
                      Misuse or unauthorized repairs may void warranty.
                    </p>
                  </div>
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
                Need Warranty Support?
              </h2>
              <p className="text-accent-foreground/80 text-sm md:text-lg mb-8 max-w-xl mx-auto">
                Visit our store or contact us for assistance with warranty claims and service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => window.location.href = '/contact'} className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl flex items-center gap-3 justify-center">
                  <Home className="w-5 h-5"/>
                  Visit Store for Support
                </button>
                <a href="tel:+91XXXXXXXXXX" className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300 flex items-center gap-3 justify-center">
                  <Phone className="w-5 h-5"/>
                  Call for Assistance
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default WarrantyInfo;
