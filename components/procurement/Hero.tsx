import Image from 'next/image';
import img from '@/public/LooperGroup.svg';
import SectionHeader from '../shared/section-header';
import Container from '../shared/container';

function ProcurementHero() {
  return (
    <section className="bg-gradient-to-r from-[#00254F] to-[#00365D] text-white py-8 md:py-16 relative overflow-hidden">
      <Container className="mx-auto px-4 md:px-6 mt-20 md:pt-40">
        <div className="relative z-20">
          <div className="w-full md:w-4/5">
            <span className="px-3 py-1.5 md:px-5 md:py-2 rounded-l-full text-black bg-primary uppercase text-xs md:text-sm">
              #shipwithgodday
            </span>

            <div className="mt-3 md:mt-4 w-full xl:w-4/5">
              <div className="hidden md:block">
                <SectionHeader>
                  Complete Procurement Solutions from China
                </SectionHeader>
              </div>

              <div className="block md:hidden">
                <SectionHeader size="md">
                  Complete Procurement Solutions from China
                </SectionHeader>
              </div>

              <p className="text-primary text-base md:text-lg italic mt-3">
                Expert sourcing of goods from trusted Chinese
                suppliers
              </p>
            </div>
          </div>
        </div>
      </Container>

      <div className="absolute top-0 bottom-0 right-0 h-full w-full">
        <div className="relative h-full w-full">
          <Image
            src={img}
            alt="svg"
            className="h-full w-full object-cover lg:object-contain object-right opacity-70 lg:opacity-100 transition-all duration-300"
            priority
          />
        </div>
      </div>
    </section>
  );
}

export default ProcurementHero;
