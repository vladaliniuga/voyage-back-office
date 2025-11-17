import DashboardLayout from '@/components/layout/DashboardLayout';

function ReservationEditor() {
  return <div>ReservationEditor</div>;
}

// Opt-in: use DashboardLayout for this page
ReservationEditor.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// Optional: mark this page as protected
ReservationEditor.auth = true;

export default ReservationEditor;
