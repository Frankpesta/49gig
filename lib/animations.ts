/**
 * GSAP Animation Utilities
 * Professional, minimal animations inspired by Andela
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Fade in animation
 */
export const fadeIn = (element: HTMLElement | string, options?: gsap.TweenVars) => {
  return gsap.from(element, {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: "power2.out",
    ...options,
  });
};

/**
 * Fade in up animation
 */
export const fadeInUp = (element: HTMLElement | string, options?: gsap.TweenVars) => {
  return gsap.from(element, {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: "power3.out",
    ...options,
  });
};

/**
 * Stagger fade in for lists
 */
export const staggerFadeIn = (
  elements: HTMLElement[] | string,
  options?: gsap.TweenVars
) => {
  return gsap.from(elements, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.1,
    ...options,
  });
};

/**
 * Scale in animation
 */
export const scaleIn = (element: HTMLElement | string, options?: gsap.TweenVars) => {
  return gsap.from(element, {
    opacity: 0,
    scale: 0.9,
    duration: 0.5,
    ease: "back.out(1.7)",
    ...options,
  });
};

/**
 * Slide in from left
 */
export const slideInLeft = (element: HTMLElement | string, options?: gsap.TweenVars) => {
  return gsap.from(element, {
    opacity: 0,
    x: -50,
    duration: 0.6,
    ease: "power2.out",
    ...options,
  });
};

/**
 * Slide in from right
 */
export const slideInRight = (element: HTMLElement | string, options?: gsap.TweenVars) => {
  return gsap.from(element, {
    opacity: 0,
    x: 50,
    duration: 0.6,
    ease: "power2.out",
    ...options,
  });
};

/**
 * Scroll-triggered animation
 */
export const scrollReveal = (
  element: HTMLElement | string,
  options?: gsap.TweenVars
) => {
  return gsap.from(element, {
    opacity: 0,
    y: 60,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      toggleActions: "play none none none",
    },
    ...options,
  });
};

/**
 * Smooth page transition
 */
export const pageTransition = (callback: () => void) => {
  const tl = gsap.timeline();
  tl.to("body", {
    opacity: 0,
    duration: 0.3,
    ease: "power2.in",
    onComplete: callback,
  });
};

/**
 * Button hover animation
 */
export const buttonHover = (element: HTMLElement) => {
  return gsap.to(element, {
    scale: 1.05,
    duration: 0.2,
    ease: "power2.out",
  });
};

/**
 * Button hover out animation
 */
export const buttonHoverOut = (element: HTMLElement) => {
  return gsap.to(element, {
    scale: 1,
    duration: 0.2,
    ease: "power2.out",
  });
};


