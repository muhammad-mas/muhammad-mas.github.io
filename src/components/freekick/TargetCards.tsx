import type { KickTarget } from './targets';

interface TargetCardsProps {
  targets: KickTarget[];
  found: string[];
  /** Show every card's answer (results view, no game). */
  revealAll?: boolean;
}

/** One card per target: hidden until the ball goes through its hoop. */
export function TargetCards({ targets, found, revealAll = false }: TargetCardsProps) {
  return (
    <ul className="target-cards">
      {targets.map((target) => {
        const shown = revealAll || found.includes(target.id);
        return (
          <li key={target.id} className={`target-card card${shown ? '' : ' target-card--hidden'}`}>
            <p className="target-card__label">{target.label}</p>
            {shown ? (
              <>
                <p className="target-card__value">{target.value}</p>
                <p className="target-card__detail">{target.detail}</p>
                {target.href && (
                  <a className="target-card__link" href={target.href}>
                    More
                  </a>
                )}
              </>
            ) : (
              <p className="target-card__hint">Shoot through this hoop to reveal it</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
