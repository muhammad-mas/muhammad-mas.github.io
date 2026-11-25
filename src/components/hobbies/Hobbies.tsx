import type { ContributionsFile } from '../../types/contributions';
import { FreeKickSection } from '../freekick/FreeKickSection';
import { RepChallengeSection } from '../repchallenge/RepChallengeSection';

/** Football and the gym, each as a small game you can play on the page. */
export function Hobbies({ contributions }: { contributions?: ContributionsFile }) {
  return (
    <div className="hobbies">
      <article className="hobby" aria-labelledby="hobby-football">
        <h3 id="hobby-football" className="hobby__title">
          <span aria-hidden="true">⚽</span> Football: free kick
        </h3>
        <p className="hobby__intro">Score through the hoops in the goal to reveal my numbers and coding habits.</p>
        <FreeKickSection contributions={contributions} />
      </article>

      <article className="hobby" aria-labelledby="hobby-gym">
        <h3 id="hobby-gym" className="hobby__title">
          <span aria-hidden="true">🏋️</span> Gym: rep challenge
        </h3>
        <p className="hobby__intro">How many clean squats can you time in 20 seconds?</p>
        <RepChallengeSection />
      </article>
    </div>
  );
}
