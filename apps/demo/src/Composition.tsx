import { Composition, Series } from "remotion";
import { Problem } from "./scenes/01-Problem";
import { Solution } from "./scenes/02-Solution";
import { HowItWorks } from "./scenes/03-HowItWorks";
import { TerminalDemo } from "./scenes/04-TerminalDemo";
import { Closing } from "./scenes/08-Closing";
import { FPS, WIDTH, HEIGHT } from "./styles";

function AgentBazaarDemo() {
  return (
    <Series>
      {/* Intro: what problem, what solution, how it works */}
      <Series.Sequence durationInFrames={Math.ceil(4.5 * FPS)}>
        <Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.ceil(3.5 * FPS)}>
        <Solution />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.ceil(5.5 * FPS)}>
        <HowItWorks />
      </Series.Sequence>

      {/* Live terminal demo — the main event */}
      <Series.Sequence durationInFrames={Math.ceil(20 * FPS)}>
        <TerminalDemo />
      </Series.Sequence>

      {/* Closing */}
      <Series.Sequence durationInFrames={Math.ceil(4.5 * FPS)}>
        <Closing />
      </Series.Sequence>
    </Series>
  );
}

// Total: 4.5 + 3.5 + 5.5 + 20 + 4.5 = 38s
export function RemotionRoot() {
  const totalDuration = Math.ceil(38 * FPS);

  return (
    <Composition
      id="AgentBazaarDemo"
      component={AgentBazaarDemo}
      durationInFrames={totalDuration}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
}
