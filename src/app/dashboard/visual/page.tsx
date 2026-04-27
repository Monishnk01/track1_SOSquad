export default function VisualDashboard() {
  return (
    <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
      <h1 className="text-5xl font-black mb-4" tabIndex={0}>Visual Assistance Dashboard</h1>
      <p className="text-2xl max-w-3xl">
        This space will feature high-contrast elements, screen-reader optimized layouts, and a camera-integrated object detection system to warn you of physical obstacles via the Speech Synthesis API.
      </p>
    </div>
  );
}
