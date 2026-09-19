"use client";

const stars = [
  { left: "23%", top: "18%", delay: "0s", size: "3px" },
  { left: "68%", top: "20%", delay: "1.5s", size: "4px" },
  { left: "82%", top: "38%", delay: "3s", size: "2px" },
  { left: "45%", top: "51%", delay: "2s", size: "3px" },
  { left: "76%", top: "68%", delay: "4s", size: "2px" },
  { left: "18%", top: "73%", delay: "2.8s", size: "2px" },
];

export default function ChatPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#674631]">
      {/* 기본 색상 */}
      <div className="absolute inset-0 bg-[#674631]" />

      {/* 흐릿하게 움직이는 구름 */}
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="cloud cloud-three" />

      {/* 은은한 빛 */}
      <div className="light light-one" />
      <div className="light light-two" />

      {/* 별빛 */}
      {stars.map((star, index) => (
        <span
          key={index}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}

      {/* 채팅 UI가 들어갈 자리 */}
      <section className="relative z-10 flex min-h-screen flex-col">
        <header className="p-6 text-sm tracking-[0.25em] text-[#f4dfc5]">
          AURAI
        </header>

        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-[#f4dfc5]/70">
            채팅 화면
          </p>
        </div>
      </section>

      <style jsx>{`
        .cloud {
          position: absolute;
          width: 420px;
          height: 260px;
          border-radius: 50%;
          filter: blur(65px);
          opacity: 0.32;
          pointer-events: none;
        }

        .cloud-one {
          top: -80px;
          left: -100px;
          background: #9b5d3d;
          animation: cloudMoveOne 18s ease-in-out infinite alternate;
        }

        .cloud-two {
          top: 20%;
          right: -180px;
          background: #d8895d;
          opacity: 0.25;
          animation: cloudMoveTwo 24s ease-in-out infinite alternate;
        }

        .cloud-three {
          bottom: -120px;
          left: 20%;
          background: #3f281f;
          opacity: 0.3;
          animation: cloudMoveThree 21s ease-in-out infinite alternate;
        }

        .light {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }

        .light-one {
          top: 5%;
          right: 10%;
          background: #d88a58;
          opacity: 0.2;
          animation: lightPulse 9s ease-in-out infinite alternate;
        }

        .light-two {
          bottom: 12%;
          left: -80px;
          background: #b96f48;
          opacity: 0.18;
          animation: lightPulse 12s ease-in-out infinite alternate-reverse;
        }

        .star {
          position: absolute;
          z-index: 5;
          border-radius: 999px;
          background: #fff4dc;
          box-shadow:
            0 0 5px #fff4dc,
            0 0 12px #e8ad78;
          animation: twinkle 4s ease-in-out infinite;
        }

        @keyframes cloudMoveOne {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(90px, 35px, 0) scale(1.15);
          }
        }

        @keyframes cloudMoveTwo {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(-120px, 50px, 0) scale(1.2);
          }
        }

        @keyframes cloudMoveThree {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(80px, -30px, 0) scale(1.1);
          }
        }

        @keyframes lightPulse {
          from {
            opacity: 0.12;
            transform: scale(0.9);
          }
          to {
            opacity: 0.3;
            transform: scale(1.15);
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.7);
          }

          45% {
            opacity: 1;
            transform: scale(1.4);
          }

          60% {
            opacity: 0.45;
            transform: scale(0.9);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cloud,
          .light,
          .star {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}