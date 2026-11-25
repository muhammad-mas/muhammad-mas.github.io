import type { SkillGroup } from '../../content/profile';

export function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="skills">
      {groups.map((group) => (
        <div key={group.name} className="skills__group card">
          <h3 className="skills__name">{group.name}</h3>
          <ul className="chip-list">
            {group.items.map((item) => (
              <li key={item} className="chip">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
