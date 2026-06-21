// Status pill. Maps known states/roles to tone classes.
const TONES = {
  Paid: 'badge-green', PAID: 'badge-green', Approved: 'badge-green',
  Unpaid: 'badge-red', UNPAID: 'badge-red', Rejected: 'badge-red',
  Pending: 'badge-amber',
  ADMIN: 'badge-indigo', MANAGER: 'badge-amber', MEMBER: 'badge-gray',
};

export default function Badge({ status }) {
  return <span className={`badge ${TONES[status] || 'badge-gray'}`}>{status}</span>;
}
