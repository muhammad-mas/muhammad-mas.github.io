import type { UseQueryResult } from '@tanstack/react-query';
import type { ContributionsFile } from '../../types/contributions';
import { Heatmap } from './Heatmap';

/** The Activity section body: loading / error / sample-data states around the heatmap. */
export function Activity({ query }: { query: UseQueryResult<ContributionsFile> }) {
  if (query.isPending) {
    return <div className="heatmap card heatmap--placeholder" aria-busy="true" aria-label="Loading activity" />;
  }
  if (query.isError) {
    return (
      <p className="notice" role="status">
        Activity data couldn’t be loaded ({query.error.message}).
      </p>
    );
  }
  return (
    <>
      {query.data.sample && (
        <p className="notice" role="note">
          <strong>Sample data.</strong> These numbers are made up until the first real sync runs.
        </p>
      )}
      <Heatmap data={query.data} />
    </>
  );
}
