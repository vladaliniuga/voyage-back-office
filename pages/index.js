import DashboardLayout from '@/components/layout/DashboardLayout';

function NavCard() {
  return (
    <div className="w-full aspect-square border border-gray-200 bg-white shadow rounded-2xl hover:shadow-none cursor-pointer"></div>
  );
}

function Home() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 w-full max-w-6xl gap-4">
        <NavCard />
        <NavCard />
        <NavCard />
      </div>
    </>
  );
}

// Opt-in: use DashboardLayout for this page
Home.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

// Optional: mark this page as protected
Home.auth = true;

export default Home;
