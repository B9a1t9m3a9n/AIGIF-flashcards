export default function Footer() {
  return (
    <footer className="text-center text-gray-500 text-sm py-4">
      <p>GIFuzion © {new Date().getFullYear()} - Transform your ideas into animations</p>
      <div className="mt-2">
        <a href="#" className="text-primary hover:text-primary-800 transition-colors">Terms</a>
        <span className="mx-2">·</span>
        <a href="#" className="text-primary hover:text-primary-800 transition-colors">Privacy</a>
        <span className="mx-2">·</span>
        <a href="#" className="text-primary hover:text-primary-800 transition-colors">Help</a>
      </div>
    </footer>
  );
}
