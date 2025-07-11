import React, { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

const TOUR_KEY = 'taskhive_onboarding_tour_completed';

function getUserRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

const allSteps = [
  {
    id: 'navbar',
    attachTo: { element: '.navbar', on: 'bottom' },
    title: 'Navigation Bar',
    text: 'Welcome to TaskHive! This is your main navigation bar.',
  },
  {
    id: 'profile',
    attachTo: { element: '.profile-link', on: 'bottom' },
    title: 'Profile',
    text: 'Visit your profile to manage your account and see your activity.',
  },
  {
    id: 'post-task',
    attachTo: { element: '.post-task-btn', on: 'bottom' },
    title: 'Post a Task',
    text: 'Click here to post a new task and find freelancers!',
    onlyFor: 'task_poster',
  },
  {
    id: 'notifications',
    attachTo: { element: '.notifications-dropdown', on: 'bottom' },
    title: 'Notifications',
    text: 'Check your notifications here for updates and messages.',
  },
];

const OnboardingTour = () => {
  const tourRef = useRef(null);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      const userRole = getUserRole();
      // Only include steps for elements that exist in the DOM and match user role
      const steps = allSteps.filter(step => {
        if (step.onlyFor && step.onlyFor !== userRole) return false;
        const el = document.querySelector(step.attachTo.element);
        return !!el;
      });
      if (steps.length === 0) return;

      const tour = new Shepherd.Tour({
        defaultStepOptions: {
          scrollTo: true,
          cancelIcon: { enabled: true },
          classes: 'shepherd-theme-arrows',
        },
        useModalOverlay: true,
      });

      steps.forEach((step, idx) => {
        tour.addStep({
          ...step,
          buttons: [
            ...(idx > 0 ? [{ text: 'Back', action: tour.back }] : []),
            ...(idx < steps.length - 1
              ? [{ text: 'Next', action: tour.next }]
              : [{ text: 'Finish', action: () => { tour.complete(); } }]),
          ],
        });
      });

      tour.on('complete', () => {
        localStorage.setItem(TOUR_KEY, 'true');
      });
      tour.on('cancel', () => {
        localStorage.setItem(TOUR_KEY, 'true');
      });

      tourRef.current = tour;
      setTimeout(() => tour.start(), 500); // slight delay to ensure DOM is ready
    }
  }, []);

  return null;
};

export default OnboardingTour; 