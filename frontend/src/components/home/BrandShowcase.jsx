const brands = [
    { name: "Samsung", logo: "https://cdn-icons-png.flaticon.com/512/882/882747.png" },
    { name: "LG", logo: "https://cdn-icons-png.flaticon.com/512/5969/5969267.png" },
    { name: "Sony", logo: "https://cdn-icons-png.flaticon.com/512/731/731935.png" },
    { name: "Whirlpool", logo: "https://cdn-icons-png.flaticon.com/512/5969/5969059.png" },
    { name: "Panasonic", logo: "https://cdn-icons-png.flaticon.com/512/5969/5969183.png" },
    { name: "Philips", logo: "https://cdn-icons-png.flaticon.com/512/882/882726.png" },
    { name: "Bosch", logo: "https://cdn-icons-png.flaticon.com/512/5969/5969125.png" },
];
const brands2 = [
    { name: "Daikin", logo: "https://cdn-icons-png.flaticon.com/512/5968/5968854.png" },
    { name: "Voltas", logo: "https://cdn-icons-png.flaticon.com/512/732/732221.png" },
    { name: "Bajaj", logo: "https://cdn-icons-png.flaticon.com/512/733/733609.png" },
    { name: "Prestige", logo: "https://cdn-icons-png.flaticon.com/512/732/732084.png" },
    { name: "Havells", logo: "https://cdn-icons-png.flaticon.com/512/733/733585.png" },
    { name: "Crompton", logo: "https://cdn-icons-png.flaticon.com/512/281/281763.png" },
    { name: "Orient", logo: "https://cdn-icons-png.flaticon.com/512/888/888879.png" },
];
const repeatedBrands = (items, repeat = 4) => Array.from({ length: repeat }).flatMap(() => items);
export function BrandShowcase() {
    return (<section className="w-full py-12 md:py-16">
      <div className="mx-auto px-4 text-center">
        <h2 className="mb-10 text-2xl font-bold text-foreground md:text-3xl">
          Shop by Brand
        </h2>

        {/* Carousel Container */}
        <div className="relative w-full overflow-hidden">
          {/* Row 1 - scroll left */}
          <div className="mb-8 flex w-max animate-scroll-left gap-12 md:gap-16">
            {repeatedBrands(brands, 4).map((brand, i) => (<a key={`${brand.name}-${i}`} href="#" className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center transition-opacity duration-300 hover:opacity-70">
                <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain"/>
              </a>))}
          </div>

          {/* Row 2 - scroll right */}
          <div className="flex w-max animate-scroll-right gap-12 md:gap-16">
            {repeatedBrands(brands2, 4).map((brand, i) => (<a key={`${brand.name}-${i}`} href="#" className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center transition-opacity duration-300 hover:opacity-70">
                <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain"/>
              </a>))}
          </div>

          {/* Fade overlays */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent md:w-32"/>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent md:w-32"/>
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 25s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 25s linear infinite;
        }
      `}</style>
    </section>);
}
