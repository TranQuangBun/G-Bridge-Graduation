import { useEffect, useRef } from "react";

/**
 * Custom hook for scroll-triggered animations
 * Easy to use and modify by developers
 *
 * Usage:
 * const ref = useScrollAnimation('animate-on-scroll');
 * <div ref={ref}>Content</div>
 */

export const useScrollAnimation = (
  animationClass = "animate-on-scroll",
  options = {}
) => {
  const elementRef = useRef(null);

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: "50px",
    triggerOnce: true,
    ...options,
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add initial animation class
    element.classList.add(animationClass);

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add 'in-view' class to trigger animation
          entry.target.classList.add("in-view");

          // If triggerOnce is true, stop observing
          if (defaultOptions.triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!defaultOptions.triggerOnce) {
          // Remove 'in-view' class when out of view (for repeating animations)
          entry.target.classList.remove("in-view");
        }
      },
      {
        threshold: defaultOptions.threshold,
        rootMargin: defaultOptions.rootMargin,
      }
    );

    observer.observe(element);

    // Cleanup
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [
    animationClass,
    defaultOptions.threshold,
    defaultOptions.rootMargin,
    defaultOptions.triggerOnce,
  ]);

  return elementRef;
};

/**
 * Hook for staggered animations
 * Perfect for lists and cards
 */
export const useStaggeredAnimation = (delay = 100) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach((child, index) => {
            child.classList.add("animate-stagger");
            setTimeout(() => {
              child.classList.add("in-view");
            }, index * delay);
          });

          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    observer.observe(container);

    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, [delay]);

  return containerRef;
};

/**
 * Hook for parallax effects
 * Smooth parallax scrolling
 */
export const useParallax = (speed = 0.5) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.classList.add("parallax-element");

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const scrollProgress =
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height);

      element.style.setProperty("--scroll-progress", scrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [speed]);

  return elementRef;
};

/**
 * Hook for number counter animations
 * Animates numbers from 0 to target value
 */
export const useCounter = (endValue, duration = 2000) => {
  const counterRef = useRef(null);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    element.classList.add("counter-animation");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const startTime = Date.now();
          const startValue = 0;

          const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(
              startValue + (endValue - startValue) * easeOutQuart
            );

            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              element.textContent = endValue.toLocaleString();
            }
          };

          animate();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [endValue, duration]);

  return counterRef;
};

/**
 * Hook for magnetic hover effects
 * Elements follow mouse cursor
 */
export const useMagneticHover = (strength = 0.3) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = "translate(0px, 0px)";
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return elementRef;
};

/**
 * Hook to respect user's motion preferences for accessibility
 */
export const useMotionPreferences = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => {
      if (mediaQuery.matches) {
        document.body.classList.add("reduced-motion");
      } else {
        document.body.classList.remove("reduced-motion");
      }
    };

    handleChange(); // Initial check
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);
};

/**
 * HOC for easy animation wrapping
 */
export const withAnimation = (
  Component,
  animationClass = "animate-on-scroll"
) => {
  return (props) => {
    const ref = useScrollAnimation(animationClass);
    return <Component ref={ref} {...props} />;
  };
};
