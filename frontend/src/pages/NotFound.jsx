import { Link } from 'react-router-dom';
import { HeartHandshake, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="notfound-screen">
      <div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, color: 'var(--color-forest-deep)' }}>
          <HeartHandshake size={34} />
        </div>
        <div className="code">404</div>
        <h2>This page isn&rsquo;t part of the care plan.</h2>
        <p>The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved. Let&rsquo;s get you back to somewhere familiar.</p>
        <Link to="/dashboard" className="btn btn-primary">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
