import React from 'react';
import Container from '@/components/shared/container';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

function Hero() {
  return (
    <section
      style={{
        backgroundImage: 'url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className="h-screen flex items-end lg:items-center relative">
      <div className="absolute inset-0 bg-black opacity-40 md:hidden" />
      <Container className="mt-56 relative">
        <div className="w-full md:w-4/5 lg:w-3/5 space-y-3 md:space-y-6 text-white pb-24 md:pb-20">
          <span className="px-3 py-1.5 md:px-5 md:py-2 rounded-l-full text-black bg-primary uppercase text-xs md:text-sm">
            #shipwithgodday
          </span>
          <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl xl:text-6xl capitalize tracking-wide md:leading-14 xl:leading-20 mt-2">
            facilitating{' '}
            <span className="text-primary">seamless</span> Sea
            shipping from china to ghana
          </h1>
          <p className="md:text-2xl">
            Our mission is to create a seamless supply chain from
            china to ghana either via air or sea.
          </p>
          <Button>
            Schedule a Call <Icon name="ArrowRight" />
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
