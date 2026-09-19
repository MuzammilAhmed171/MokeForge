import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useStudio } from '../store';
import { LogoMark, IcPlus, IcFolder, IcStar, IcSettings, IcLogout } from '../icons';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const projects = useStudio(s => s.projects);
  const loadingProjects = useStudio(s => s.loadingProjects);
  const openProject = useStudio(s => s.openProject);
  const createProject = useStudio(s => s.createProject);

  const handleCreateProject = async () => {
    await createProject('Untitled Project', 'Website', 1600, 1000);
    // Navigate directly to editor after creating project
    window.location.href = '/editor';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-line2 bg-panel/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={32} />
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>MockForge</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-acc/20 flex items-center justify-center text-acc font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <Link to="/profile" className="icon-btn" title="Profile">
              <IcSettings size={18} />
            </Link>
            <button onClick={handleLogout} className="icon-btn" title="Logout">
              <IcLogout size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-mut)' }}>
            {user?.emailVerified ? 'Your account is verified' : 'Please verify your email'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <button
            onClick={handleCreateProject}
            className="card card-hover p-8 text-left w-full"
          >
            <div className="w-16 h-16 rounded-lg bg-acc/10 flex items-center justify-center mb-4 text-acc">
              <IcPlus size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>
              Create New Project
            </h3>
            <p style={{ color: 'var(--color-mut)' }}>
              Start a new mockup project from scratch
            </p>
          </button>
        </div>

        {/* Recent Projects */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>
              Recent Projects
            </h2>
            <span className="text-sm" style={{ color: 'var(--color-dim)' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingProjects ? (
            /* Skeleton Loading */
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="w-full aspect-video bg-panel2" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-panel2 rounded w-3/4" />
                    <div className="h-3 bg-panel2 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="card border-dashed !border-line p-12 text-center">
              <IcFolder size={48} />
              <p className="text-lg font-medium mt-4 mb-2">No projects yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--color-mut)' }}>
                Create your first project to get started
              </p>
              <button onClick={handleCreateProject} className="btn btn-acc">
                <IcPlus size={16} />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {projects.slice(0, 6).map(project => (
                <button
                  key={project.id}
                  onClick={async () => {
                    await openProject(project.id);
                    window.location.href = '/editor';
                  }}
                  className="card card-hover overflow-hidden text-left"
                >
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-panel2 flex items-center justify-center">
                      <IcFolder size={32} />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold mb-1 truncate">{project.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--color-dim)' }}>
                      {project.type} • {project.canvas.w}×{project.canvas.h}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-disp)', color: 'var(--color-acc)' }}>
              {projects.length}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-mut)' }}>Total Projects</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-disp)', color: 'var(--color-acc2)' }}>
              {projects.reduce((sum, p) => sum + p.devices.length, 0)}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-mut)' }}>Devices Created</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-disp)', color: 'var(--color-gold)' }}>
              {projects.reduce((sum, p) => sum + p.exportCount, 0)}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-mut)' }}>Total Exports</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-disp)', color: 'var(--color-fg)' }}>
              {projects.reduce((sum, p) => sum + p.assets.length, 0)}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-mut)' }}>Assets Uploaded</div>
          </div>
        </div>
      </main>
    </div>
  );
}
