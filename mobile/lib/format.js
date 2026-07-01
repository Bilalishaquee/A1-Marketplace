export const money = (cents) => '$' + Math.round((Number(cents) || 0) / 100).toLocaleString('en-US');
export const dollars = (value) => '$' + Math.round(Number(value) || 0).toLocaleString('en-US');

export function summarizeBids(bids = []) {
  const pending = bids.filter((bid) => bid.status === 'PENDING');
  const accepted = bids.filter((bid) => bid.status === 'ACCEPTED');
  return {
    pending,
    accepted,
    awardedValue: accepted.reduce((sum, bid) => sum + (Number(bid.amount) || 0), 0),
  };
}

export function eligibleClientProjects(projects = []) {
  return projects.filter((project) => ['MATCHED', 'SCHEDULED', 'IN_PROGRESS'].includes(project.status));
}

export function eligibleProviderProjects(bids = []) {
  return bids.filter((bid) => bid.status === 'ACCEPTED').map((bid) => bid.project).filter(Boolean);
}
