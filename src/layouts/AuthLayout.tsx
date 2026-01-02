
import React, { useState } from "react";
import TextType from "@/components/TextType";

import heroImage from '../assets/BG1 (2).png';
import AnimatedGrainyBackground from '../components/ui/Grainy_bg'; // Adjust path as needed

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const heroImageUrl = heroImage;
  const [showLoopingRepeat, setShowLoopingRepeat] = useState(false);

  return (
    <div className="min-h-screen bg-[#202020] text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left Panel - Hero Image (Visible on Medium screens and up) */}
        <div className="hidden md:flex flex-col justify-end bg-black relative overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Creator with a camera"
            className="absolute inset-0 w-full h-full object-cover z-[1]"
          />
          
          {/* <div className="absolute inset-0 z-[2] pointer-events-none">
            <AnimatedGrainryBackground className="w-full h-full pointer-events-none" />
          </div> */}
          {/* <CrossStitchBloom /> */}
          <div className="absolute align-items-center justify-content-center  inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[2]"></div>
          <div className="relative z-[3] p-10">
            <TextType 
              as="h1"
              className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight"
              text={[
                'Create.<br/><span class="text-primary">Earn.</span><br />'
              ]}
              typingSpeed={100}
              pauseDuration={100}
              showCursor={!showLoopingRepeat}
              cursorCharacter="_"
              loop={false}
              deletingSpeed = {0}
              onTypingComplete={() => setShowLoopingRepeat(true)}
            />
            {showLoopingRepeat && (
              <div>
                <TextType
                  as="h1"
                  className="font-display text-4xl lg:text-5xl font-bold text-secondary-200 leading-tight"
                  text={['Repeat.']}
                  typingSpeed={150}
                  pauseDuration={500}
                  showCursor={true}
                  cursorCharacter="_"
                  loop={true}
                  deletingSpeed={50}
                  delayBeforeStartTyping={100}
                />
              </div>
            )}
          </div>
        </div>
        {/* Right Panel - Form Content */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto relative overflow-hidden">
          <div className="absolute inset-0 z-[0] pointer-events-none">
            <AnimatedGrainyBackground className="pointer-events-none" />
          </div>
          <div className="relative z-[1] w-full max-w-xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
