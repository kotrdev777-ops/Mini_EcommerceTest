'use client';

import { useEffect, useState } from 'react';

export type BannerSlideView = {
  id: string;
  imageKey: string | null;
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  link: string;
};

export function BannerCarousel({ slides }: { slides: BannerSlideView[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) return null;
  return <section className="hero banner-carousel" aria-label="โปรโมชั่นร้านค้า" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
    {slides.map((slide, index) => <div className={index === current ? 'banner-slide is-active' : 'banner-slide'} key={slide.id} aria-hidden={index !== current}>
      <img className="hero-banner" src={slide.imageKey ? '/api/media/' + encodeURIComponent(slide.imageKey) : '/gift-cart-banner.jpg'} alt="" fetchPriority={index === 0 ? 'high' : undefined}/>
      <div className="container hero-inner"><div className="hero-copy">
        {slide.eyebrow && <span className="eyebrow">{slide.eyebrow}</span>}
        <h1>{slide.title}</h1>
        {slide.description && <p>{slide.description}</p>}
        {slide.buttonText && slide.link && <a className="button" href={slide.link} tabIndex={index === current ? 0 : -1}>{slide.buttonText}</a>}
      </div></div>
    </div>)}
    {slides.length > 1 && <div className="banner-controls container" aria-label="เลือกสไลด์ banner">
      {slides.map((slide, index) => <button key={slide.id} type="button" className={index === current ? 'banner-dot is-active' : 'banner-dot'} aria-label={`สไลด์ ${index + 1}: ${slide.title}`} aria-current={index === current ? 'true' : undefined} onClick={() => setCurrent(index)}/>)}
    </div>}
  </section>;
}
