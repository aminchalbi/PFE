import { Link } from 'react-router-dom';

const Sidebar = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="sidebar">
      <nav>
        <button onClick={() => scrollToSection('dashboard')} className="sidebar-link">
          Dashboard
        </button>
        <button onClick={() => scrollToSection('users')} className="sidebar-link">
          Users
        </button>
        <button onClick={() => scrollToSection('salons')} className="sidebar-link">
          Salons
        </button>
        <button onClick={() => scrollToSection('statistics')} className="sidebar-link">
          Statistics
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;