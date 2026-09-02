import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Briefcase,
  GraduationCap,
  BookOpen,
  Heart,
  X,
  Settings,
  Upload,
  Form
} from 'lucide-react';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-weber-purple text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-weber-purple-light">
          <div className="flex items-center">
            <Logo white />
          </div>
          <button
            className="lg:hidden text-white hover:text-gray-200"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-5 px-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
            end
          >
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </NavLink>

          <NavLink
            to="/alumni"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
          >
            <Users className="mr-3 h-5 w-5" />
            Alumni Directory
          </NavLink>

          <NavLink
            to="/surveypage"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
            end
          >
            <Form className="mr-3 h-5 w-5" />
            View & Modify Surveys
          </NavLink>

          {/* <NavLink
            to="/uploadCSV"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
          >
            <Upload className="mr-3 h-5 w-5" />
            Upload
          </NavLink> */}

          {/* <NavLink
            to="/adminpage"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
          >
            <Settings className="mr-3 h-5 w-5" />
            Admin
          </NavLink> */}

          {/* <NavLink
            to="/graduate-studies"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
          >
            <GraduationCap className="mr-3 h-5 w-5" />
            Graduate Studies
          </NavLink>

          <NavLink
            to="/internships"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
          >
            <BookOpen className="mr-3 h-5 w-5" />
            Internships
          </NavLink>

          <NavLink
            to="/mentor-program"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-weber-purple-light text-white'
                : 'text-gray-300 hover:bg-weber-purple-light hover:text-white'
              }`
            }
          >
            <Heart className="mr-3 h-5 w-5" />
            Mentor Program
          </NavLink> */}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-weber-purple-light">
          <div className="text-xs text-gray-300">
            Weber State University<br />
            College of Engineering, Applied Science & Technology<br />
            © {new Date().getFullYear()} All rights reserved
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;