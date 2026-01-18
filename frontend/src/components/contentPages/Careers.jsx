import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Briefcase, Target, Award, CheckCircle, Clock, MapPin, Phone, Mail, DollarSign, TrendingUp, HeartHandshake, Zap } from "lucide-react";
const jobOpenings = [
    {
        title: "Sales Person",
        department: "Sales",
        type: "Full-time",
        location: "Nagapattinam",
        experience: "Freshers & Experienced",
        salary: "Best in Industry + Incentives",
        description: "Looking for enthusiastic sales persons with good communication skills and passion for customer service.",
        requirements: [
            "Age: 20 to 35 years",
            "Qualification: Minimum 10th/12th/Any Degree",
            "Good communication and interpersonal skills",
            "Basic knowledge of home appliances",
            "Willingness to learn and grow"
        ]
    }
];
const responsibilities = [
    "Assist customers in selecting suitable home appliances",
    "Explain product features, benefits, and pricing",
    "Maintain product displays and store cleanliness",
    "Handle customer queries politely and professionally",
    "Support billing and after-sales coordination",
    "Achieve sales targets and contribute to store growth"
];
const benefits = [
    {
        icon: DollarSign,
        title: "Competitive Salary",
        description: "Best in industry based on experience",
        color: "from-green-500 to-emerald-500"
    },
    {
        icon: TrendingUp,
        title: "Sales Incentives",
        description: "Performance-based incentives",
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: Zap,
        title: "Training & Growth",
        description: "Continuous learning opportunities",
        color: "from-purple-500 to-violet-500"
    },
    {
        icon: HeartHandshake,
        title: "Supportive Environment",
        description: "Friendly and collaborative workplace",
        color: "from-pink-500 to-rose-500"
    }
];
const applyMethods = [
    {
        icon: MapPin,
        title: "Visit Our Store",
        description: "Come directly to our store in Nagapattinam with your resume",
        method: 'visit',
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: Phone,
        title: "Call Us",
        description: "Call us to discuss the position and schedule an interview",
        method: 'call',
        color: "from-green-500 to-emerald-500"
    },
    {
        icon: Mail,
        title: "Email Your Resume",
        description: "Send your resume and cover letter to our careers email",
        method: 'email',
        color: "from-purple-500 to-violet-500"
    }
];
const Careers = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
        });
    }, []);
    const handleApply = (method) => {
        switch (method) {
            case 'visit':
                alert("Visit our store at Sri Krishna Home Appliances, Nagapattinam to apply in person.");
                break;
            case 'call':
                window.location.href = 'tel:+91XXXXXXXXXX';
                break;
            case 'email':
                window.location.href = 'mailto:careers@srikrishnahomeappliances.com';
                break;
        }
    };
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
                  <Briefcase className="w-4 h-4"/>
                  Join Our Team
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="font-heading text-3xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Build Your Career With{" "}
                <span className="text-accent">Sri Krishna Home Appliances</span>
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                We're growing and looking for enthusiastic individuals to join our team. 
                If you have a passion for customer service and want to grow with us, we welcome you.
              </p>
            </div>
          </div>
        </section>

        {/* Job Openings */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Current <span className="text-accent">Openings</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Explore our available positions and find your perfect fit
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {jobOpenings.map((job, index) => (<div key={job.title} data-aos="fade-up" data-aos-delay={index * 100} className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/50 transition-all duration-300 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                      <h3 className="font-heading text-center text-2xl md:text-3xl font-bold text-foreground mb-3">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent font-medium text-xs">
                          <Briefcase className="w-3 h-3"/>
                          {job.department}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 font-medium text-xs">
                          <Clock className="w-3 h-3"/>
                          {job.type}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 font-medium text-xs">
                          <MapPin className="w-3 h-3"/>
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <div className="md:text-right text-center">
                      <div className="text-xl font-bold text-accent mb-1">{job.salary}</div>
                      <div className="text-sm text-muted-foreground">{job.experience}</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-8 text-xs md:text-lg">{job.description}</p>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                        <Target className="w-5 h-5 text-accent"/>
                        Eligibility Criteria
                      </h4>
                      <ul className="space-y-3 text-sm md:text-md">
                        {job.requirements.map((req, i) => (<li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"/>
                            <span className="text-foreground">{req}</span>
                          </li>))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                        <Award className="w-5 h-5 text-accent"/>
                        Key Responsibilities
                      </h4>
                      <ul className="space-y-3 text-sm md:text-md">
                        {responsibilities.map((resp, i) => (<li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                            <span className="text-foreground">{resp}</span>
                          </li>))}
                      </ul>
                    </div>
                  </div>
                </div>))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-10 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Work With <span className="text-accent">Us</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We value our team members and offer a supportive work environment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (<div key={benefit.title} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                    
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-7 h-7 text-white"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>);
        })}
            </div>
          </div>
        </section>

        {/* How to Apply */}
        <section className="py-10 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14" data-aos="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                How to <span className="text-accent">Apply</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Choose your preferred method to submit your application
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {applyMethods.map((method, index) => {
            const Icon = method.icon;
            return (<button key={method.title} onClick={() => handleApply(method.method)} data-aos="fade-up" data-aos-delay={index * 100} className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden text-left">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}/>
                    
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} mb-5 group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white"/>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {method.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {method.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-accent font-medium text-sm group-hover:gap-2 transition-all">
                      {method.method === 'call' ? '+91 XXXXXXXXXX →' : 'Apply Now →'}
                    </span>
                  </button>);
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
                Ready to Start Your Career?
              </h2>
              <p className="text-accent-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Join our growing team and build a rewarding career with Sri Krishna Home Appliances.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => handleApply('call')} className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 shadow-xl">
                  Call Now to Apply
                </button>
                <button onClick={() => handleApply('email')} className="px-8 py-4 bg-transparent border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground/10 transition-all duration-300">
                  Send Your Resume
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);
};
export default Careers;
